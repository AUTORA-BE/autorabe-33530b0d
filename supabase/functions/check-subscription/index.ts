import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createStripeClient, parseEnv } from "../_shared/stripe.ts";
import { tierSlugFromPriceKey } from "../_shared/catalog.ts";

/** Paliers accordés manuellement en base (offres pro/premium sur devis). */
const KNOWN_SLUGS = new Set(["particulier", "pro", "premium"]);

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return handlePreflight(req);

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { environment } = await req.json().catch(() => ({}));
    const env = parseEnv(environment);

    /** Repli : abonnement accordé manuellement, enregistré en base. */
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
      const slug = KNOWN_SLUGS.has(String(row!.product_id)) ? String(row!.product_id) : null;
      return {
        subscribed: true,
        product_id: row!.product_id,
        tier_slug: slug,
        subscription_end: row!.current_period_end,
        source: "manual",
      };
    };

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

    if (!customerId) {
      const manual = await manualGrant();
      return new Response(
        JSON.stringify(
          manual ?? {
            subscribed: false,
            product_id: null,
            tier_slug: null,
            subscription_end: null,
            source: "stripe",
          },
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (!subs.data.length) {
      const manual = await manualGrant();
      return new Response(
        JSON.stringify(
          manual ?? {
            subscribed: false,
            product_id: null,
            tier_slug: null,
            subscription_end: null,
            source: "stripe",
          },
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subscription = subs.data[0];
    const item = subscription.items.data[0];
    // deno-lint-ignore no-explicit-any
    const price = item?.price as any;
    const lookupKey = price?.lookup_key ?? price?.metadata?.lovable_external_id ?? null;
    const tierSlug = tierSlugFromPriceKey(lookupKey);
    // deno-lint-ignore no-explicit-any
    const periodEnd = (item as any)?.current_period_end ?? (subscription as any).current_period_end;

    return new Response(
      JSON.stringify({
        subscribed: true,
        product_id: typeof price?.product === "string" ? price.product : price?.product?.id ?? null,
        tier_slug: tierSlug,
        subscription_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        source: "stripe",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[check-subscription] Error:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
