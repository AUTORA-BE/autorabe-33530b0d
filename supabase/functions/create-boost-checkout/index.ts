import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

const BOOST_PRICES: Record<string, { env_var: string; level: string; hours: number }> = {
  boost_24h: { env_var: "STRIPE_PRICE_BOOST_24H", level: "boost_24h", hours: 24 },
  boost_48h: { env_var: "STRIPE_PRICE_BOOST_48H", level: "boost_48h", hours: 48 },
  boost_72h: { env_var: "STRIPE_PRICE_BOOST_72H", level: "boost_72h", hours: 72 },
  boost_7d: { env_var: "STRIPE_PRICE_BOOST_7D", level: "boost_7d", hours: 168 },
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return handlePreflight(req);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { boostTier, listingId } = await req.json();
    if (!boostTier || !listingId) throw new Error("Missing boostTier or listingId");

    const boostConfig = BOOST_PRICES[boostTier];
    if (!boostConfig) throw new Error("Invalid boost tier");

    // Aucune valeur de repli : un prix manquant doit échouer bruyamment.
    const boostPriceId = (Deno.env.get(boostConfig.env_var) ?? "").trim();
    if (!boostPriceId) {
      await logOpsAlert("create-boost-checkout", `Variable de prix manquante: ${boostConfig.env_var}`, {
        severity: "critical",
        context: { boost_tier: boostTier, missing_env: boostConfig.env_var },
      });
      return new Response(JSON.stringify({ error: "Configuration de prix manquante" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // ── Ownership check: caller must own the listing being boosted ──
    const supabaseAdminCheck = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: ownedListing, error: ownErr } = await supabaseAdminCheck
      .from("car_listings")
      .select("id")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    if (ownErr || !ownedListing) {
      return new Response(JSON.stringify({ error: "Forbidden: you do not own this listing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const ALLOWED_ORIGINS = ["https://autora.be", "https://www.autora.be", "https://autorabe.lovable.app"];
    const rawOrigin = req.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : "https://autora.be";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: boostPriceId, quantity: 1 }],
      mode: "payment",
      payment_method_types: ["card", "bancontact", "sepa_debit"],
      success_url: `${origin}/dashboard?boost_success=true&listing=${listingId}&tier=${boostTier}`,
      cancel_url: `${origin}/dashboard?boost_canceled=true`,
      client_reference_id: user.id,
      metadata: {
        listing_id: listingId,
        boost_level: boostConfig.level,
        boost_hours: String(boostConfig.hours),
        user_id: user.id,
        supabase_user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[create-boost-checkout] Error:", (error as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
