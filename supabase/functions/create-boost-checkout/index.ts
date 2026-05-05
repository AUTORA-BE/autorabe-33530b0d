import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const BOOST_PRICES: Record<string, { price_id: string; level: string; hours: number }> = {
  boost_24h: {
    price_id: "price_1TMBroFyYvJx8HZKFXbGsYW6",
    level: "boost_24h",
    hours: 24,
  },
  boost_48h: {
    price_id: "price_1TMBsFFyYvJx8HZK5ETOWM6Y",
    level: "boost_48h",
    hours: 48,
  },
  boost_72h: {
    price_id: "price_1TMBspFyYvJx8HZKYEFZlqrM",
    level: "boost_72h",
    hours: 72,
  },
  boost_7d: {
    price_id: "price_1TMBt6FyYvJx8HZKdcEkN3FQ",
    level: "boost_7d",
    hours: 168,
  },
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

    const origin = req.headers.get("origin") || "https://autorabe.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: boostConfig.price_id, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/dashboard?boost_success=true&listing=${listingId}&tier=${boostTier}`,
      cancel_url: `${origin}/dashboard?boost_canceled=true`,
      metadata: {
        listing_id: listingId,
        boost_level: boostConfig.level,
        boost_hours: String(boostConfig.hours),
        user_id: user.id,
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
