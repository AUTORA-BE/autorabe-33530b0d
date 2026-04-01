import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;
    console.log(`[DELETE-ACCOUNT] Starting deletion for user ${userId}`);

    // 1. Log the deletion in audit_log before deleting data
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "account_deletion",
      details: { email: userData.user.email, initiated_at: new Date().toISOString() },
    });

    // 2. Delete user data from all tables (order matters for foreign keys)
    const tables = [
      { table: "alert_notifications", filter: `alert_id.in.(SELECT id FROM user_alerts WHERE user_id='${userId}')` },
    ];

    // Delete alert notifications first (depends on user_alerts)
    const { data: alertIds } = await supabase
      .from("user_alerts")
      .select("id")
      .eq("user_id", userId);
    
    if (alertIds && alertIds.length > 0) {
      const ids = alertIds.map((a: { id: string }) => a.id);
      await supabase.from("alert_notifications").delete().in("alert_id", ids);
    }

    // Delete messages (need conversation IDs first)
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    
    if (convos && convos.length > 0) {
      const convoIds = convos.map((c: { id: string }) => c.id);
      await supabase.from("messages").delete().in("conversation_id", convoIds);
    }

    // Delete remaining user data
    const deletions = [
      supabase.from("conversations").delete().or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      supabase.from("favorites").delete().eq("user_id", userId),
      supabase.from("reviews").delete().eq("user_id", userId),
      supabase.from("reports").delete().eq("user_id", userId),
      supabase.from("user_alerts").delete().eq("user_id", userId),
      supabase.from("user_preferences").delete().eq("user_id", userId),
      supabase.from("push_subscriptions").delete().eq("user_id", userId),
      supabase.from("car_views").delete().eq("viewer_id", userId),
    ];
    await Promise.all(deletions);

    // Delete car photos from storage
    const { data: listings } = await supabase
      .from("car_listings")
      .select("id, photos")
      .eq("user_id", userId);

    if (listings) {
      for (const listing of listings) {
        if (listing.photos && listing.photos.length > 0) {
          const paths = listing.photos
            .map((url: string) => {
              const match = url.match(/car-photos\/(.+)/);
              return match ? match[1] : null;
            })
            .filter(Boolean);
          if (paths.length > 0) {
            await supabase.storage.from("car-photos").remove(paths);
          }
        }
      }
    }

    // Delete listings
    await supabase.from("car_listings").delete().eq("user_id", userId);

    // Delete avatar from storage
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.avatar_url) {
      const match = profile.avatar_url.match(/avatars\/(.+)/);
      if (match) {
        await supabase.storage.from("avatars").remove([match[1]]);
      }
    }

    // Delete profile
    await supabase.from("profiles").delete().eq("user_id", userId);

    // 3. Delete the auth user (this is the final step)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    console.log(`[DELETE-ACCOUNT] Successfully deleted user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[DELETE-ACCOUNT] Error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
