import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const APP_URL = "https://autora.be";

const BOOST_LABELS: Record<string, string> = {
  boost_24h: "24 heures",
  boost_48h: "48 heures",
  boost_72h: "72 heures",
  boost_7d: "7 jours",
};

function buildEmailShell(badgeColor: string, badgeText: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f0f0;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🚗 AutoRA</h1>
          <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Notification de boost</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background: ${badgeColor}15; color: ${badgeColor}; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 16px;">
              ${badgeText}
            </span>
          </div>
          ${bodyContent}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0; text-align: center;">
            Cet email a été envoyé automatiquement par AutoRA.<br>
            Vous recevez cet email car vous avez activé un boost sur votre annonce.
          </p>
        </div>
      </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  try {
    // ── Service-role guard: only internal callers (cron / scheduler) ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!token || token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

        try {
          // Skip suppressed recipients (GDPR opt-out compliance)
          const { data: suppressed } = await supabase
            .from("suppressed_emails")
            .select("id")
            .eq("email", listing.contact_email.toLowerCase())
            .maybeSingle();
          if (suppressed) {
            console.log(`Skipping suppressed recipient: ${listing.contact_email}`);
            return;
          }

          await resend.emails.send({
            from: "AutoRA <noreply@autora.be>",
            to: [listing.contact_email],
            subject: `⏳ Votre boost ${boostLabel} expire dans ${hoursLeft}h — ${listing.brand} ${listing.model}`,
            html: buildEmailShell("#e67e22", `⏳ Expire dans ~${hoursLeft}h`, `
              <p>Bonjour ${listing.contact_name},</p>
              <p>Votre boost <strong>${boostLabel}</strong> pour <strong>${vehicleName}</strong> expire dans environ <strong>${hoursLeft} heure${hoursLeft > 1 ? "s" : ""}</strong>.</p>
              <p>Après expiration, votre annonce ne sera plus mise en avant dans les résultats de recherche.</p>

              <div style="background: #fff7ed; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #f97316; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #9a3412; font-weight: 600;">💡 Conseil</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #7c2d12;">Renouvelez votre boost avant l'expiration pour ne pas perdre votre avantage de visibilité !</p>
              </div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="${APP_URL}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  🚀 Renouveler maintenant
                </a>
              </div>
            `),
          });
          console.log(`Warning email sent to ${listing.contact_email} for ${vehicleName}`);
        } catch (emailErr) {
          console.error(`Failed warning email for ${listing.id}:`, emailErr);
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

        try {
          // Skip suppressed recipients (GDPR opt-out compliance)
          const { data: suppressed } = await supabase
            .from("suppressed_emails")
            .select("id")
            .eq("email", listing.contact_email.toLowerCase())
            .maybeSingle();
          if (suppressed) {
            console.log(`Skipping suppressed recipient: ${listing.contact_email}`);
            return;
          }

          await resend.emails.send({
            from: "AutoRA <noreply@autora.be>",
            to: [listing.contact_email],
            subject: `🚀 Votre boost ${boostLabel} pour ${listing.brand} ${listing.model} a expiré`,
            html: buildEmailShell("#d97706", `⏰ Boost ${boostLabel} expiré`, `
              <p>Bonjour ${listing.contact_name},</p>
              <p>Votre boost <strong>${boostLabel}</strong> pour <strong>${vehicleName}</strong> vient d'expirer. Votre annonce n'apparaît plus en priorité dans les résultats de recherche.</p>

              <div style="background: #fffbeb; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">📊 Saviez-vous ?</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #78350f;">Les annonces boostées reçoivent en moyenne <strong>3x plus de vues</strong> et <strong>2x plus de messages</strong> que les annonces standard.</p>
              </div>

              <p>Renouvelez votre boost dès maintenant pour maintenir la visibilité de votre annonce !</p>

              <div style="text-align: center; margin-top: 28px;">
                <a href="${APP_URL}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  🚀 Renouveler mon boost
                </a>
              </div>
            `),
          });
          console.log(`Expiry email sent to ${listing.contact_email} for ${vehicleName}`);
        } catch (emailErr) {
          console.error(`Failed expiry email for ${listing.id}:`, emailErr);
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
