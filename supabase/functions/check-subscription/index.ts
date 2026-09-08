import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";
import { tierSlugFromPriceKey, tierSlugFromStoredProduct } from "../_shared/catalog.ts";

/** Même condition exacte que `payments-status` : défaut fermé. */
const paymentsEnabled = () => (Deno.env.get("PAYMENTS_ENABLED") ?? "").trim() === "true";

/** `environment` absent ou invalide ne doit jamais lever : repli sur "sandbox". */
function safeEnv(value: unknown): StripeEnv {
  return value === "live" ? "live" : "sandbox";
}

const EMPTY = {
  subscribed: false,
  product_id: null,
  tier_slug: null,
  subscription_end: null,
  source: "none",
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.email) {
      return respond({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const env = safeEnv((body as { environment?: unknown })?.environment);

    /** Repli : abonnement accordé manuellement, enregistré en base. Aucun appel réseau. */
    const manualGrant = async () => {
      const { data: row } = await supabaseAdmin
        .from("subscriptions")
        .select("product_id, status, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const active = row &&
        ["active", "trialing", "past_due"].includes(String(row.status)) &&
        (!row.current_period_end || new Date(String(row.current_period_end)) > new Date());

      if (!active) return null;
      return {
        subscribed: true,
        product_id: row!.product_id,
        // Résout aussi bien un slug moderne qu'un `prod_…` Stripe hérité.
        tier_slug: tierSlugFromStoredProduct(row!.product_id as string | null),
        subscription_end: row!.current_period_end,
        source: "manual",
      };
    };

    // 1) La base d'abord : elle ne dépend d'aucune clé ni d'aucun service externe.
    const manual = await manualGrant();

    // 2) Stripe uniquement si les paiements sont ouverts, et jamais fatal.
    if (paymentsEnabled()) {
      try {
        const stripe = createStripeClient(env);
        const customers = await stripe.customers.search({
          query: `metadata['userId']:'${user.id}'`,
          limit: 1,
        });
        let customerId = customers.data[0]?.id;
        if (!customerId) {
          const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
          customerId = byEmail.data[0]?.id;
        }

        if (customerId) {
          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
          });
          if (subs.data.length) {
            const subscription = subs.data[0];
            const item = subscription.items.data[0];
            // deno-lint-ignore no-explicit-any
            const price = item?.price as any;
            const lookupKey = price?.lookup_key ?? price?.metadata?.lovable_external_id ?? null;
            // deno-lint-ignore no-explicit-any
            const periodEnd = (item as any)?.current_period_end ??
              // deno-lint-ignore no-explicit-any
              (subscription as any).current_period_end;

            return respond({
              subscribed: true,
              product_id: typeof price?.product === "string"
                ? price.product
                : price?.product?.id ?? null,
              tier_slug: tierSlugFromPriceKey(lookupKey),
              subscription_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              source: "stripe",
            });
          }
        }
      } catch (stripeError) {
        // Panne ou clé absente : on dégrade vers le repli manuel, jamais de 500.
        console.error(
          "[check-subscription] Stripe unavailable:",
          stripeError instanceof Error ? stripeError.message : stripeError,
        );
      }
    }

    return respond(manual ?? EMPTY);
  } catch (error) {
    // Dernier filet : un utilisateur authentifié ne doit jamais recevoir un 500.
    console.error("[check-subscription] Error:", error instanceof Error ? error.message : error);
    return respond(EMPTY);
  }
});
