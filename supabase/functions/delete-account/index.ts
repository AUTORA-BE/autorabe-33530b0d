import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

/**
 * RGPD right-to-be-forgotten endpoint.
 * Cascades deletion across:
 *   - All user-owned tables (profiles, listings, alerts, favorites, reviews, reports,
 *     preferences, push subscriptions, daily message counts, car views, drafts)
 *   - All conversations + messages where user is buyer OR seller
 *   - Storage: vehicle-photos, car-photos (legacy), avatars, chat-images, car-pass
 *   - Stripe: cancels active subscriptions before deleting the row
 *   - Subscriptions row
 *   - Auth user
 * audit_log entries are preserved for accounting (anonymised by user deletion).
 */
serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return handlePreflight(req);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const log = (step: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ level: "info", fn: "delete-account", step, ...extra }));
  const logErr = (step: string, err: unknown, extra: Record<string, unknown> = {}) => {
    void logOpsAlert("delete-account", `${step}: ${err instanceof Error ? err.message : String(err)}`, {
      severity: step === "fatal" ? "critical" : "error",
      context: { step },
    });
    return console.error(
      JSON.stringify({
        level: "error",
        fn: "delete-account",
        step,
        message: err instanceof Error ? err.message : String(err),
        ...extra,
      })
    );
  };


  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    log("start", { user_id: userId });

    // Audit log first (preserved post-deletion for accounting/legal)
    // Email is hashed (SHA-256) — no plaintext PII in audit trail (GDPR art. 5)
    const emailHashBuf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode((userEmail ?? "").toLowerCase()),
    );
    const emailHash = Array.from(new Uint8Array(emailHashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: "account_deletion",
      details: { email_sha256: emailHash, initiated_at: new Date().toISOString() },
    });

    // ─── 1. Cancel active Stripe subscriptions ───────────────────────────
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("stripe_subscription_id, status")
          .eq("user_id", userId);

        for (const sub of subs ?? []) {
          if (
            sub.stripe_subscription_id &&
            ["active", "trialing", "past_due"].includes(sub.status)
          ) {
            try {
              await stripe.subscriptions.cancel(sub.stripe_subscription_id);
              log("stripe_sub_cancelled", { sub_id: sub.stripe_subscription_id });
            } catch (e) {
              logErr("stripe_sub_cancel_failed", e, {
                sub_id: sub.stripe_subscription_id,
              });
            }
          }
        }
      }
    } catch (e) {
      logErr("stripe_block_error", e); // non-fatal
    }

    // ─── 2. Delete dependent rows (children before parents) ─────────────
    const { data: alertIds } = await supabase
      .from("user_alerts")
      .select("id")
      .eq("user_id", userId);
    if (alertIds && alertIds.length > 0) {
      await supabase
        .from("alert_notifications")
        .delete()
        .in("alert_id", alertIds.map((a: { id: string }) => a.id));
    }

    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    if (convos && convos.length > 0) {
      const convoIds = convos.map((c: { id: string }) => c.id);
      await supabase.from("messages").delete().in("conversation_id", convoIds);
    }
    // Also delete any orphan messages sent by this user in conversations
    // where they are no longer buyer/seller (defensive)
    await supabase.from("messages").delete().eq("sender_id", userId);

    // ─── 3. Delete user-owned rows in parallel ──────────────────────────
    await Promise.all([
      supabase
        .from("conversations")
        .delete()
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      supabase.from("favorites").delete().eq("user_id", userId),
      supabase.from("reviews").delete().eq("user_id", userId),
      supabase.from("reports").delete().eq("user_id", userId),
      supabase.from("user_alerts").delete().eq("user_id", userId),
      supabase.from("user_preferences").delete().eq("user_id", userId),
      supabase.from("push_subscriptions").delete().eq("user_id", userId),
      supabase.from("car_views").delete().eq("viewer_id", userId),
      supabase.from("daily_message_counts").delete().eq("user_id", userId),
      supabase.from("listing_drafts").delete().eq("user_id", userId),
      supabase.from("subscriptions").delete().eq("user_id", userId),
    ]);

    // ─── 4. Storage cleanup: photos linked to listings ──────────────────
    const { data: listings } = await supabase
      .from("car_listings")
      .select("id, photos, car_pass_url")
      .eq("user_id", userId);

    if (listings) {
      const vehiclePaths: string[] = [];
      const carPhotosPaths: string[] = [];
      const carPassPaths: string[] = [];
      for (const l of listings) {
        if (Array.isArray(l.photos)) {
          for (const url of l.photos) {
            if (typeof url !== "string") continue;
            const vp = url.match(/vehicle-photos\/(.+)/);
            if (vp) {
              vehiclePaths.push(vp[1]);
              continue;
            }
            const cp = url.match(/car-photos\/(.+)/);
            if (cp) carPhotosPaths.push(cp[1]);
          }
        }
        if (typeof l.car_pass_url === "string") {
          const m = l.car_pass_url.match(/car-pass\/(.+)/);
          if (m) carPassPaths.push(m[1]);
        }
      }
      if (vehiclePaths.length)
        await supabase.storage.from("vehicle-photos").remove(vehiclePaths);
      if (carPhotosPaths.length)
        await supabase.storage.from("car-photos").remove(carPhotosPaths);
      if (carPassPaths.length)
        await supabase.storage.from("car-pass").remove(carPassPaths);
    }

    // ─── 5. Delete listings ─────────────────────────────────────────────
    await supabase.from("car_listings").delete().eq("user_id", userId);

    // ─── 6. Storage cleanup: avatars + chat-images (scoped by uid prefix)
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.avatar_url) {
      const m = profile.avatar_url.match(/avatars\/(.+)/);
      if (m) await supabase.storage.from("avatars").remove([m[1]]);
    }

    // chat-images bucket is scoped by uid as first folder segment
    try {
      const { data: chatFiles } = await supabase.storage
        .from("chat-images")
        .list(userId, { limit: 1000 });
      if (chatFiles && chatFiles.length > 0) {
        await supabase.storage
          .from("chat-images")
          .remove(chatFiles.map((f: { name: string }) => `${userId}/${f.name}`));
      }
    } catch (e) {
      logErr("chat_images_cleanup", e);
    }

    // ─── 7. Profile + auth user (final) ─────────────────────────────────
    await supabase.from("profiles").delete().eq("user_id", userId);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    log("success", { user_id: userId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logErr("fatal", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
