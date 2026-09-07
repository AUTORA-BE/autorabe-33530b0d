import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createStripeClient, parseEnv, resolveOrCreateCustomer } from "../_shared/stripe.ts";
import { BOOST_PRICES } from "../_shared/catalog.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let requestedTier = "unknown";
  let requestedEnv = "unknown";

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, listingId, returnUrl, environment } = await req.json();
    requestedTier = typeof priceId === "string" ? priceId : "invalid";
    requestedEnv = typeof environment === "string" ? environment : "invalid";
    const env = parseEnv(environment);

    const boostConfig = typeof priceId === "string" ? BOOST_PRICES[priceId] : undefined;
    if (!boostConfig) {
      return new Response(JSON.stringify({ error: "Invalid boost tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof listingId !== "string" || !listingId) {
      return new Response(JSON.stringify({ error: "Missing listingId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof returnUrl !== "string" || !/^https?:\/\//.test(returnUrl)) {
      return new Response(JSON.stringify({ error: "Invalid returnUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // L'appelant doit être propriétaire de l'annonce boostée.
    const { data: ownedListing, error: ownErr } = await supabaseAdmin
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

    const stripe = createStripeClient(env);
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new Error(`Price not found: ${priceId}`);
    const stripePrice = prices.data[0];

    const productId = typeof stripePrice.product === "string"
      ? stripePrice.product
      : stripePrice.product.id;
    const product = await stripe.products.retrieve(productId);

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: user.email,
      userId: user.id,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer: customerId,
      managed_payments: { enabled: true },
      payment_intent_data: { description: product.name },
      metadata: {
        userId: user.id,
        supabase_user_id: user.id,
        listing_id: listingId,
        boost_level: boostConfig.level,
        boost_hours: String(boostConfig.hours),
        managed_payments: "true",
      },
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-boost-checkout] Error:", message);
    await logOpsAlert("create-boost-checkout", message, {
      severity: "critical",
      context: { boost_tier: requestedTier, environment: requestedEnv },
    });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
