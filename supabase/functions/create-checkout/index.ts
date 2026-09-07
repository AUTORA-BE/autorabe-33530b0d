import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

/**
 * Plans achetables en self-serve, résolus côté serveur uniquement.
 * Le client n'envoie qu'une clé de plan : jamais d'identifiant de prix Stripe.
 * Pro Garage et Premium sont sur devis (activation manuelle par un admin).
 */
const PLAN_ENV_VARS: Record<string, string> = {
  particulier: "STRIPE_PRICE_PARTICULIER",
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
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { plan } = await req.json();

    const envVar = typeof plan === "string" ? PLAN_ENV_VARS[plan] : undefined;
    if (!envVar) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Aucune valeur de repli : un prix manquant doit échouer bruyamment.
    const priceId = (Deno.env.get(envVar) ?? "").trim();
    if (!priceId) {
      await logOpsAlert("create-checkout", `Variable de prix manquante: ${envVar}`, {
        severity: "critical",
        context: { plan, missing_env: envVar },
      });
      return new Response(JSON.stringify({ error: "Configuration de prix manquante" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
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
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
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
