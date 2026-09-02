import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Structured JSON logger — safe for Supabase log search & Sentry breadcrumbs
const log = (level: "info" | "warn" | "error", step: string, data?: Record<string, unknown>) => {
  const line = JSON.stringify({
    level,
    fn: "stripe-webhook",
    step,
    ts: new Date().toISOString(),
    ...data,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

const getSupabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

type Meta = Record<string, string> | null | undefined;

/** Paginated lookup of a Supabase user by email (listUsers only returns one page). */
async function findUserIdByEmail(
  supabaseAdmin: SupabaseAdmin,
  email: string,
): Promise<string | null> {
  const perPage = 200;
  const maxPages = 50;
  const target = email.toLowerCase();
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed (page ${page}): ${error.message}`);
    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (users.length < perPage) break; // incomplete page → last page
  }
  return null;
}

/**
 * Resolve the Supabase user_id for a Stripe event, in cascade:
 *  1. supabase_user_id present in the event metadata (no query)
 *  2. subscriptions.user_id matched on stripe_customer_id
 *  3. fallback: paginated email lookup via listUsers
 */
async function resolveUserId(
  supabaseAdmin: SupabaseAdmin,
  stripe: Stripe,
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  metadata?: Meta,
): Promise<string | null> {
  // 1. metadata
  const fromMeta = metadata?.supabase_user_id;
  if (fromMeta) return fromMeta;

  if (!customerId) return null;
  const id = typeof customerId === "string" ? customerId : customerId.id;

  // 2. existing subscription row
  const { data: subRow } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", id)
    .maybeSingle();
  if (subRow?.user_id) return subRow.user_id as string;

  // 3. email fallback
  const customer = await stripe.customers.retrieve(id);
  if (customer.deleted || !customer.email) return null;
  return await findUserIdByEmail(supabaseAdmin, customer.email);
}

/** Throws a structured error when the user cannot be resolved (→ 500 → Stripe retries). */
function requireUserId(
  userId: string | null,
  event: Stripe.Event,
  context: string,
): string {
  if (!userId) {
    log("error", "user_resolution_failed", {
      event_id: event.id,
      event_type: event.type,
      context,
    });
    throw new Error(`Unable to resolve Supabase user for event ${event.id} (${context})`);
  }
  return userId;
}

/**
 * Idempotency guard.
 * Returns true if the event has already been processed (caller should skip).
 * Otherwise inserts the event_id (UNIQUE) and returns false.
 * On race conditions (parallel deliveries), the UNIQUE constraint ensures only one wins.
 */
async function alreadyProcessed(
  supabaseAdmin: SupabaseAdmin,
  event: Stripe.Event,
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("stripe_processed_events").insert({
    event_id: event.id,
    event_type: event.type,
    payload_summary: {
      api_version: event.api_version,
      created: event.created,
    },
  });

  if (!error) return false; // first time — proceed

  // 23505 = unique_violation → event already processed
  // deno-lint-ignore no-explicit-any
  const code = (error as any).code;
  if (code === "23505") {
    log("info", "event_already_processed", { event_id: event.id, event_type: event.type });
    return true;
  }
  log("error", "idempotency_insert_failed", { event_id: event.id, error: error.message });
  // Fail-safe: if we can't record, treat as new and continue (Stripe will retry on 5xx anyway)
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    log("error", "missing_secrets", { hasKey: !!stripeKey, hasSecret: !!webhookSecret });
    return new Response(
      JSON.stringify({ error: "Stripe configuration missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = getSupabaseAdmin();

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing stripe-signature header");
    // ✅ ASYNC verification — required in Deno (uses Web Crypto, no Node 'crypto' module)
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    log("info", "signature_verified", { event_id: event.id, type: event.type });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "signature_verification_failed", { error: message });
    // 400 → Stripe will mark as failed, no retry storm on bad signature
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${message}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 🛡️ IDEMPOTENCY GUARD
  if (await alreadyProcessed(supabaseAdmin, event)) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      // ──────────────────────────────────────────────
      // CHECKOUT COMPLETED → activate boost OR subscription
      // ──────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("info", "checkout_completed", {
          event_id: event.id,
          customer_id: session.customer,
          amount_total: session.amount_total,
          currency: session.currency,
          mode: session.mode,
        });

        // --- Boost activation from metadata ---
        const listingId = session.metadata?.listing_id;
        const boostLevel = session.metadata?.boost_level;
        const boostDays = session.metadata?.boost_days;
        const boostHours = session.metadata?.boost_hours;

        if (listingId && boostLevel && (boostDays || boostHours)) {
          const expiresAt = new Date();
          if (boostHours) expiresAt.setHours(expiresAt.getHours() + parseInt(boostHours, 10));
          else if (boostDays) expiresAt.setDate(expiresAt.getDate() + parseInt(boostDays, 10));

          const { error: updateError } = await supabaseAdmin
            .from("car_listings")
            .update({
              boost_level: boostLevel,
              boost_expires_at: expiresAt.toISOString(),
              boost_warning_sent: false,
            })
            .eq("id", listingId);

          if (updateError) {
            log("error", "boost_activation_failed", {
              event_id: event.id,
              listing_id: listingId,
              error: updateError.message,
            });
          } else {
            log("info", "boost_activated", {
              event_id: event.id,
              listing_id: listingId,
              boost_level: boostLevel,
              expires_at: expiresAt.toISOString(),
            });
          }
        }

        // --- Subscription activation ---
        if (session.subscription && session.customer) {
          const userId = requireUserId(
            (session.client_reference_id ??
              (await resolveUserId(supabaseAdmin, stripe, session.customer, session.metadata))),
            event,
            "checkout.session.completed",
          );
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          const productId = subscription.items.data[0]?.price?.product as string;
          const subscriptionEnd = new Date(
            subscription.current_period_end * 1000,
          ).toISOString();

          const { error } = await supabaseAdmin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id:
                  typeof session.customer === "string"
                    ? session.customer
                    : session.customer.id,
                stripe_subscription_id: subId,
                product_id: productId,
                status: "active",
                current_period_end: subscriptionEnd,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          if (error) {
            log("error", "subscription_upsert_failed", {
              event_id: event.id,
              user_id: userId,
              error: error.message,
            });
            throw new Error(`subscription upsert failed: ${error.message}`);
          }
          log("info", "subscription_activated", {
            event_id: event.id,
            user_id: userId,
            product_id: productId,
            period_end: subscriptionEnd,
          });
        }
        break;
      }

      // ──────────────────────────────────────────────
      // SUBSCRIPTION CREATED / UPDATED
      // ──────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(supabaseAdmin, stripe, subscription.customer);
        if (userId) {
          const productId = subscription.items.data[0]?.price?.product as string;
          const subscriptionEnd = new Date(
            subscription.current_period_end * 1000,
          ).toISOString();

          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id:
                typeof subscription.customer === "string"
                  ? subscription.customer
                  : subscription.customer.id,
              stripe_subscription_id: subscription.id,
              product_id: productId,
              status: subscription.status,
              current_period_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          log("info", "subscription_synced", {
            event_id: event.id,
            user_id: userId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
          });
        }
        break;
      }

      // ──────────────────────────────────────────────
      // SUBSCRIPTION DELETED → mark cancelled
      // ──────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(supabaseAdmin, stripe, subscription.customer);
        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          log("info", "subscription_canceled", {
            event_id: event.id,
            user_id: userId,
            stripe_subscription_id: subscription.id,
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        log("info", "invoice_paid", {
          event_id: event.id,
          customer_id: invoice.customer,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        log("warn", "invoice_payment_failed", {
          event_id: event.id,
          customer_id: invoice.customer,
          amount_due: invoice.amount_due,
        });
        const failedUserId = await resolveUserId(supabaseAdmin, stripe, invoice.customer);
        if (failedUserId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("user_id", failedUserId);
          log("info", "subscription_marked_past_due", {
            event_id: event.id,
            user_id: failedUserId,
          });
        }
        break;
      }

      // ──────────────────────────────────────────────
      // CHARGE REFUNDED → log + mark subscription canceled if applicable
      // ──────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        log("warn", "charge_refunded", {
          event_id: event.id,
          customer_id: charge.customer,
          charge_id: charge.id,
          amount_refunded: charge.amount_refunded,
          currency: charge.currency,
        });
        // If a subscription is tied, mark canceled (manual review recommended)
        const refundUserId = await resolveUserId(supabaseAdmin, stripe, charge.customer);
        if (refundUserId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", refundUserId);
        }
        break;
      }

      default:
        log("info", "unhandled_event", { event_id: event.id, type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("error", "handler_exception", { event_id: event.id, type: event.type, error: message });
    // Return 500 → Stripe will retry. (Idempotency guard prevents double-processing.)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
