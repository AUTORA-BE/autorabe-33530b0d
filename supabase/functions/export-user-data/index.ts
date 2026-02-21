import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    console.log(`[EXPORT-DATA] Starting export for user ${userId}`);

    // Log the export in audit_log
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "data_export",
      details: { initiated_at: new Date().toISOString() },
    });

    // Fetch all user data
    const [
      { data: profile },
      { data: listings },
      { data: favorites },
      { data: conversations },
      { data: reviews },
      { data: alerts },
      { data: preferences },
      { data: auditLogs },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("car_listings").select("*").eq("user_id", userId),
      supabase.from("favorites").select("*, car_listings_public(brand, model, year, price)").eq("user_id", userId),
      supabase.from("conversations").select("*, messages(*)").or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      supabase.from("reviews").select("*").eq("user_id", userId),
      supabase.from("user_alerts").select("*").eq("user_id", userId),
      supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("audit_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      format_version: "1.0",
      user: {
        id: userData.user.id,
        email: userData.user.email,
        created_at: userData.user.created_at,
        last_sign_in_at: userData.user.last_sign_in_at,
      },
      profile,
      listings: listings || [],
      favorites: favorites || [],
      conversations: conversations || [],
      reviews: reviews || [],
      alerts: alerts || [],
      preferences,
      audit_log: auditLogs || [],
    };

    console.log(`[EXPORT-DATA] Export complete for user ${userId}`);

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="autora-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EXPORT-DATA] Error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
