import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Find expired boosts before resetting them
    const { data: expiredListings, error: fetchError } = await supabase
      .from("car_listings")
      .select("id, brand, model, year, contact_email, contact_name, boost_level")
      .not("boost_level", "eq", "none")
      .not("boost_expires_at", "is", null)
      .lt("boost_expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    const count = expiredListings?.length ?? 0;

    if (count === 0) {
      return new Response(
        JSON.stringify({ success: true, expired: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reset expired boosts
    const ids = expiredListings!.map((l) => l.id);
    const { error: updateError } = await supabase
      .from("car_listings")
      .update({ boost_level: "none", boost_expires_at: null })
      .in("id", ids);

    if (updateError) throw updateError;

    // Send email notifications to sellers
    const emailPromises = expiredListings!.map(async (listing) => {
      const vehicleName = `${listing.brand} ${listing.model} (${listing.year})`;
      const boostLabel = listing.boost_level === "ultra" ? "Ultra" : "Premium";
      const appUrl = "https://autora.be";

      try {
        await resend.emails.send({
          from: "AutoRa <noreply@autora.be>",
          to: [listing.contact_email],
          subject: `🚀 Votre boost ${boostLabel} pour ${listing.brand} ${listing.model} a expiré`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f0f0;">
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">🚗 AutoRa</h1>
                  <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Notification de boost</p>
                </div>
                
                <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; background: #fbbf2415; color: #d97706; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 16px;">
                      ⏰ Boost ${boostLabel} expiré
                    </span>
                  </div>

                  <p>Bonjour ${listing.contact_name},</p>
                  
                  <p>Votre boost <strong>${boostLabel}</strong> pour <strong>${vehicleName}</strong> vient d'expirer. Votre annonce n'apparaît plus en priorité dans les résultats de recherche.</p>

                  <div style="background: #fffbeb; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 24px 0;">
                    <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">📊 Saviez-vous ?</p>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #78350f;">Les annonces boostées reçoivent en moyenne <strong>3x plus de vues</strong> et <strong>2x plus de messages</strong> que les annonces standard.</p>
                  </div>

                  <p>Renouvelez votre boost dès maintenant pour maintenir la visibilité de votre annonce !</p>
                  
                  <div style="text-align: center; margin-top: 28px;">
                    <a href="${appUrl}/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      🚀 Renouveler mon boost
                    </a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0; text-align: center;">
                    Cet email a été envoyé automatiquement par AutoRa.<br>
                    Vous recevez cet email car vous avez activé un boost sur votre annonce.
                  </p>
                </div>
              </body>
            </html>
          `,
        });
        console.log(`Expiry email sent to ${listing.contact_email} for ${vehicleName}`);
      } catch (emailErr) {
        console.error(`Failed to send expiry email for ${listing.id}:`, emailErr);
      }
    });

    await Promise.allSettled(emailPromises);

    console.log(`Expired ${count} boost(s), notifications sent`);

    return new Response(
      JSON.stringify({ success: true, expired: count, listings: expiredListings }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error expiring boosts:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
