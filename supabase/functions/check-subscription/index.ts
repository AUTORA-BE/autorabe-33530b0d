import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";



import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { periodEndISO } from "../_shared/stripePeriod.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

/** Slugs de paliers connus (miroir de src/features/subscription/constants/tiers.ts). */
const KNOWN_SLUGS = ["particulier", "pro", "premium"] as const;

/**
 * Résout une valeur (identifiant produit Stripe OU slug déjà stocké) vers un slug de palier.
 * Les identifiants produit Stripe sont propres au mode (test/live) : ils viennent
 * exclusivement des variables d'environnement.
 */
async function resolveTierSlug(value: string | null): Promise<string | null> {
  if (!value) return null;
  if ((KNOWN_SLUGS as readonly string[]).includes(value)) return value;

  const map: Record<string, string | undefined> = {
    particulier: Deno.env.get("STRIPE_PRODUCT_PARTICULIER"),
    pro: Deno.env.get("STRIPE_PRODUCT_PRO"),
    premium: Deno.env.get("STRIPE_PRODUCT_PREMIUM"),
  };
  for (const [slug, productId] of Object.entries(map)) {
    if (productId && productId === value) return slug;
  }

  await logOpsAlert("check-subscription", "Produit Stripe non résolu vers un palier", {
    severity: "warn",
    context: { unresolved_product_id: value },
  });
  return null;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

/** Accès accordé manuellement (après devis) : lu depuis la table subscriptions. */
async function manualGrant(
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string,
): Promise<{ product_id: string; current_period_end: string | null } | null> {
  const { data } = await admin
    .from("subscriptions")
    .select("product_id, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .not("product_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.product_id) return null;
  if (data.current_period_end && new Date(data.current_period_end) <= new Date()) return null;
  return data;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return handlePreflight(req);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { user_id: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      const granted = await manualGrant(supabaseClient, user.id);
      if (granted) {
        const tierSlug = await resolveTierSlug(granted.product_id);
        logStep("Manual grant found", { product_id: granted.product_id, tier_slug: tierSlug });
        return new Response(JSON.stringify({
          subscribed: true,
          product_id: granted.product_id,
          tier_slug: tierSlug,
          subscription_end: granted.current_period_end,
          source: "manual",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = periodEndISO(subscription);
      productId = subscription.items.data[0].price.product as string;
      logStep("Active subscription found", { productId, subscriptionEnd });
    } else {
      logStep("No active subscription");
      const granted = await manualGrant(supabaseClient, user.id);
      if (granted) {
        const tierSlug = await resolveTierSlug(granted.product_id);
        logStep("Manual grant found", { product_id: granted.product_id, tier_slug: tierSlug });
        return new Response(JSON.stringify({
          subscribed: true,
          product_id: granted.product_id,
          tier_slug: tierSlug,
          subscription_end: granted.current_period_end,
          source: "manual",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
    }

    const tierSlug = await resolveTierSlug(productId);

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      tier_slug: tierSlug,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
