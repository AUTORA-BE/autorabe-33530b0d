import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { sendTemplateEmailLogged } from "../_shared/sendTemplateEmailLogged.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

const BOOST_LABELS: Record<string, string> = {
  boost_24h: "24 heures",
  boost_48h: "48 heures",
  boost_72h: "72 heures",
  boost_7d: "7 jours",
};

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  try {
    // ── Internal-caller guard: service role key, or the shared cron token
    //    stored in the database vault (single source, no literal in the cron SQL) ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    let authorized = Boolean(token) && token === serviceRoleKey;
    if (!authorized && token) {
      const { data: ok } = await supabase.rpc("verify_cron_token", { p_token: token });
      authorized = ok === true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ── 1. Pre-expiration warnings (expires within 24h, not yet warned) ──
    const { data: warningListings, error: warnError } = await supabase
      .from("car_listings")
      .select("id, brand, model, year, contact_email, contact_name, boost_level, boost_expires_at")
      .not("boost_level", "eq", "none")
      .not("boost_expires_at", "is", null)
      .gt("boost_expires_at", now.toISOString())
      .lte("boost_expires_at", in24h.toISOString())
      .eq("boost_warning_sent", false);

    if (warnError) throw warnError;

    const warningCount = warningListings?.length ?? 0;

    if (warningCount > 0) {
      // Mark as warned
      const warnIds = warningListings!.map((l) => l.id);
      await supabase
        .from("car_listings")
        .update({ boost_warning_sent: true })
        .in("id", warnIds);

      // Send pre-expiration emails
      const warnPromises = warningListings!.map(async (listing) => {
        const vehicleName = `${listing.brand} ${listing.model} (${listing.year})`;
        const boostLabel = BOOST_LABELS[listing.boost_level] ?? listing.boost_level;
        const expiresAt = new Date(listing.boost_expires_at);
        const hoursLeft = Math.max(1, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

        const result = await sendTemplateEmailLogged("boost-status", listing.contact_email, {
          idempotencyKey: `boost-warning-${listing.id}-${listing.boost_expires_at}`,
          templateData: {
            contactName: listing.contact_name,
            vehicleName,
            brandModel: `${listing.brand} ${listing.model}`,
            boostLabel,
            variant: "warning",
            hoursLeft,
          },
        });

        if (!result.sent && result.reason === "send_failed") {
          await logOpsAlert("expire-boosts", "Envoi de l'avertissement d'expiration de boost échoué", {
            severity: "error",
            context: { listingId: listing.id, variant: "warning" },
          });
        }
      });
      await Promise.allSettled(warnPromises);
    }

    // ── 2. Expire boosts that are past due ──
    const { data: expiredListings, error: fetchError } = await supabase
      .from("car_listings")
      .select("id, brand, model, year, contact_email, contact_name, boost_level")
      .not("boost_level", "eq", "none")
      .not("boost_expires_at", "is", null)
      .lt("boost_expires_at", now.toISOString());

    if (fetchError) throw fetchError;

    const expiredCount = expiredListings?.length ?? 0;

    if (expiredCount > 0) {
      const ids = expiredListings!.map((l) => l.id);
      const { error: updateError } = await supabase
        .from("car_listings")
        .update({ boost_level: "none", boost_expires_at: null, boost_warning_sent: false })
        .in("id", ids);

      if (updateError) throw updateError;

      // Send expiry emails
      const expiryPromises = expiredListings!.map(async (listing) => {
        const vehicleName = `${listing.brand} ${listing.model} (${listing.year})`;
        const boostLabel = BOOST_LABELS[listing.boost_level] ?? listing.boost_level;

        const result = await sendTemplateEmailLogged("boost-status", listing.contact_email, {
          idempotencyKey: `boost-expired-${listing.id}-${now.toISOString().slice(0, 10)}`,
          templateData: {
            contactName: listing.contact_name,
            vehicleName,
            brandModel: `${listing.brand} ${listing.model}`,
            boostLabel,
            variant: "expired",
          },
        });

        if (!result.sent && result.reason === "send_failed") {
          await logOpsAlert("expire-boosts", "Envoi de la notification d'expiration de boost échoué", {
            severity: "error",
            context: { listingId: listing.id, variant: "expired" },
          });
        }
      });
      await Promise.allSettled(expiryPromises);
    }

    console.log(`Warnings: ${warningCount}, Expired: ${expiredCount}`);

    return new Response(
      JSON.stringify({ success: true, warnings: warningCount, expired: expiredCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in expire-boosts:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
