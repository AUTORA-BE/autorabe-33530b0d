/**
 * Webhook de paiement (passerelle Lovable).
 * Reçoit ?env=sandbox (test) ou ?env=live.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";
import { tierSlugFromPriceKey } from "../_shared/catalog.ts";
import { logOpsAlert } from "../_shared/opsAlert.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
  }
  return _supabase;
}

const log = (level: "info" | "warn" | "error", step: string, data?: Record<string, unknown>) => {
  const line = JSON.stringify({ level, fn: "payments-webhook", step, ...data });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

/** Retrouve l'utilisateur Supabase : métadonnées, puis client Stripe. */
async function resolveUserId(
  stripe: ReturnType<typeof createStripeClient>,
  // deno-lint-ignore no-explicit-any
  object: any,
): Promise<string | null> {
  const fromMeta = object?.metadata?.userId ?? object?.metadata?.supabase_user_id;
  if (fromMeta) return String(fromMeta);

  const customerId = typeof object?.customer === "string" ? object.customer : object?.customer?.id;
  if (!customerId) return null;

  const { data: subRow } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (subRow?.user_id) return subRow.user_id as string;

  const customer = await stripe.customers.retrieve(customerId);
  // deno-lint-ignore no-explicit-any
  return (customer as any)?.metadata?.userId ?? null;
}

// deno-lint-ignore no-explicit-any
function priceKeyOf(item: any): string | null {
  return item?.price?.lookup_key ?? item?.price?.metadata?.lovable_external_id ?? null;
}

const isoFromUnix = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

async function upsertSubscription(
  stripe: ReturnType<typeof createStripeClient>,
  // deno-lint-ignore no-explicit-any
  subscription: any,
) {
  const userId = await resolveUserId(stripe, subscription);
  if (!userId) {
    log("error", "user_resolution_failed", { subscription_id: subscription?.id });
    await logOpsAlert("payments-webhook", "Utilisateur introuvable pour un abonnement", {
      severity: "critical",
      context: { subscription_id: String(subscription?.id ?? "") },
    });
    return;
  }

  const item = subscription.items?.data?.[0];
  const tierSlug = tierSlugFromPriceKey(priceKeyOf(item));
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  const { error } = await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscription.id,
      product_id: tierSlug,
      status: subscription.status,
      current_period_end: isoFromUnix(periodEnd),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`subscription upsert failed: ${error.message}`);
  log("info", "subscription_synced", { user_id: userId, tier: tierSlug, status: subscription.status });
}

// deno-lint-ignore no-explicit-any
async function activateBoost(session: any) {
  const listingId = session.metadata?.listing_id;
  const boostLevel = session.metadata?.boost_level;
  const boostHours = session.metadata?.boost_hours;
  if (!listingId || !boostLevel || !boostHours) return;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + parseInt(boostHours, 10));

  const { error } = await getSupabase()
    .from("car_listings")
    .update({
      boost_level: boostLevel,
      boost_expires_at: expiresAt.toISOString(),
      boost_warning_sent: false,
    })
    .eq("id", listingId);

  if (error) {
    log("error", "boost_activation_failed", { listing_id: listingId, error: error.message });
    throw new Error(`boost activation failed: ${error.message}`);
  }
  log("info", "boost_activated", { listing_id: listingId, boost_level: boostLevel });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const stripe = createStripeClient(env);
  // deno-lint-ignore no-explicit-any
  const object = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      if (object.payment_status === "unpaid") break;
      if (object.mode === "payment") await activateBoost(object);
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      if (object.mode === "payment") await activateBoost(object);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(stripe, object);
      break;
    case "customer.subscription.deleted": {
      const { error } = await getSupabase()
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", object.id);
      if (error) throw new Error(`subscription cancel failed: ${error.message}`);
      log("info", "subscription_canceled", { subscription_id: object.id });
      break;
    }
    default:
      log("info", "unhandled_event", { type: event.type });
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    log("error", "invalid_env", { rawEnv });
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    log("error", "webhook_error", { error: e instanceof Error ? e.message : String(e) });
    return new Response("Webhook error", { status: 400 });
  }
});
