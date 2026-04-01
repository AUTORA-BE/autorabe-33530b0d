import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOOST_PRICES: Record<string, { price_id: string; level: string; days: number }> = {
  premium: {
    price_id: "price_1T8t06FyYvJx8HZKs8VorS1T",
    level: "premium",
    days: 7,
  },
  ultra: {
    price_id: "price_1T8t0jFyYvJx8HZKdirmzWBT",
    level: "ultra",
    days: 14,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Standard boost is free — apply directly
    if (boostTier === "standard") {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      const { error } = await supabaseAdmin
        .from("car_listings")
        .update({ boost_level: "standard", boost_expires_at: expiresAt.toISOString() })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) throw new Error(`Failed to apply boost: ${error.message}`);

      return new Response(JSON.stringify({ success: true, free: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Paid boosts
    const boostConfig = BOOST_PRICES[boostTier];
    if (!boostConfig) throw new Error("Invalid boost tier");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://auto-belgium.lovable.app";

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
        boost_days: String(boostConfig.days),
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
