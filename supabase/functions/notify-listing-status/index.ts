import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { sendTemplateEmailLogged } from "../_shared/sendTemplateEmailLogged.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";




interface NotifyListingStatusRequest {
  listingId?: string;
  status: "approved" | "rejected";
  // Legacy fields kept for backwards compatibility but IGNORED for security:
  // sellerEmail / sellerName are now resolved server-side from listingId.
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return handlePreflight(req);

  try {
    // ── Admin auth required (this endpoint sends AutoRA-branded emails) ──
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

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

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

    const result = await sendTemplateEmailLogged("listing-status", listing.contact_email, {
      idempotencyKey: `listing-status-${listingId}-${status}`,
      templateData: {
        contactName: listing.contact_name ?? "",
        brand: listing.brand,
        model: listing.model,
        year: String(listing.year ?? ""),
        status,
      },
    });

    if (!result.sent && result.reason === "send_failed") {
      await logOpsAlert("notify-listing-status", "Envoi de la notification de statut d'annonce échoué", {
        severity: "error",
        context: { listingId, status },
      });
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, skipped: result.sent ? undefined : "suppressed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-listing-status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
