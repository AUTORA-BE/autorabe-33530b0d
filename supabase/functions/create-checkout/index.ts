import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

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
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");

    // Server-side allowlist — mirrors the tiers exposed in
    // src/features/subscription/constants/tiers.ts. Prevents users from
    // substituting arbitrary (legacy/internal/discounted) Stripe price IDs.
    const ALLOWED_PRICE_IDS = new Set<string>([
      "price_1TMBobFyYvJx8HZKkD5EbQpY", // Particulier Boost €20
      "price_1TM8CrFyYvJx8HZKEnPfyuAW", // Pro Garage €50
      "price_1TM8OVFyYvJx8HZKsANQJFDl", // Premium €250
      // Boost (one-shot listing promotion) price IDs from boostTiers.ts
      "price_1TMBroFyYvJx8HZKFXbGsYW6",
      "price_1TMBsFFyYvJx8HZK5ETOWM6Y",
      "price_1TMBspFyYvJx8HZKYEFZlqrM",
      "price_1TMBt6FyYvJx8HZKdcEkN3FQ",
    ]);
    if (typeof priceId !== "string" || !ALLOWED_PRICE_IDS.has(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid price" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const ALLOWED_ORIGINS = ["https://autora.be", "https://www.autora.be", "https://autorabe.lovable.app"];
    const rawOrigin = req.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : "https://autora.be";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      payment_method_types: ["card", "bancontact", "sepa_debit"],
      success_url: `${origin}/payment-success`,
      cancel_url: `${origin}/payment-canceled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-checkout] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
