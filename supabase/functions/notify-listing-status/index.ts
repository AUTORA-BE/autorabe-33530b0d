import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyListingStatusRequest {
  listingId?: string;
  status: "approved" | "rejected";
  // Legacy fields kept for backwards compatibility but IGNORED for security:
  // sellerEmail / sellerName are now resolved server-side from listingId.
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Admin auth required (this endpoint sends AutoRa-branded emails) ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub;

    // Verify admin role
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: NotifyListingStatusRequest = await req.json();
    const { listingId, status } = body;
    if (!listingId || (status !== "approved" && status !== "rejected")) {
      return new Response(JSON.stringify({ error: "listingId and valid status required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Resolve seller email server-side (no caller-supplied recipient) ──
    const { data: listing, error: listErr } = await supabaseAdmin
      .from("car_listings")
      .select("contact_email, contact_name, brand, model, year")
      .eq("id", listingId)
      .single();

    if (listErr || !listing?.contact_email) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isApproved = status === "approved";
    const vehicleName = `${listing.brand} ${listing.model} (${listing.year})`;
    const subject = isApproved
      ? `✅ Votre annonce ${vehicleName} a été approuvée !`
      : `❌ Votre annonce ${vehicleName} n'a pas été approuvée`;

    const statusColor = isApproved ? "#22c55e" : "#ef4444";
    const statusIcon = isApproved ? "✅" : "❌";
    const statusText = isApproved ? "Approuvée" : "Refusée";

    const approvedMessage = `
      <p>Bonne nouvelle ! Votre annonce pour <strong>${vehicleName}</strong> a été vérifiée et approuvée par notre équipe.</p>
      <p>Elle est désormais <strong>visible par tous les acheteurs</strong> sur AutoRa.</p>
    `;
    const rejectedMessage = `
      <p>Nous avons examiné votre annonce pour <strong>${vehicleName}</strong> et malheureusement, elle n'a pas pu être approuvée.</p>
      <p>Cela peut être dû à des informations manquantes, des photos inadéquates ou un non-respect de nos conditions d'utilisation.</p>
      <p>Vous pouvez modifier votre annonce et la soumettre à nouveau depuis votre tableau de bord.</p>
    `;

    const appUrl = "https://autora.be";
    const emailResponse = await resend.emails.send({
      from: "AutoRa <noreply@autora.be>",
      to: [listing.contact_email],
      subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f0f0;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🚗 AutoRa</h1>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Notification d'annonce</p>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; background: ${statusColor}15; color: ${statusColor}; padding: 8px 20px; border-radius: 20px; font-weight: 600;">${statusIcon} Annonce ${statusText}</span>
            </div>
            <p>Bonjour ${listing.contact_name ?? ""},</p>
            ${isApproved ? approvedMessage : rejectedMessage}
            <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Véhicule concerné</p>
              <p style="margin: 4px 0 0; font-weight: 600; color: #1e293b;">${vehicleName}</p>
            </div>
            <div style="text-align: center; margin-top: 28px;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                ${isApproved ? "Voir mon tableau de bord" : "Modifier mon annonce"}
              </a>
            </div>
          </div>
        </body></html>`,
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-listing-status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
