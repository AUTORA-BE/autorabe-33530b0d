import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const getSupabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

/**
 * Resolve a Stripe customer email to a Supabase user_id
 */
async function resolveUserId(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  stripe: Stripe,
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  if (!customerId) return null;

  const id = typeof customerId === "string" ? customerId : customerId.id;
  const customer = await stripe.customers.retrieve(id);
  if (customer.deleted || !customer.email) return null;

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === customer.email);
  return user?.id ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  try {
    const body = await req.text();
    let event: Stripe.Event;

    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook signature verified");

    logStep("Event received", { type: event.type, id: event.id });

    const supabaseAdmin = getSupabaseAdmin();

    switch (event.type) {
      // ──────────────────────────────────────────────
      // CHECKOUT COMPLETED → activate boost OR subscription
      // ──────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", {
          customer: session.customer,
          email: session.customer_email,
          subscription: session.subscription,
          metadata: session.metadata,
        });

        // --- Boost activation from metadata ---
        const listingId = session.metadata?.listing_id;
        const boostLevel = session.metadata?.boost_level;
        const boostDays = session.metadata?.boost_days;
        const boostHours = session.metadata?.boost_hours;

        if (listingId && boostLevel && (boostDays || boostHours)) {
          logStep("Activating boost", { listingId, boostLevel, boostDays, boostHours });

          const expiresAt = new Date();
          if (boostHours) {
            expiresAt.setHours(expiresAt.getHours() + parseInt(boostHours, 10));
          } else if (boostDays) {
            expiresAt.setDate(expiresAt.getDate() + parseInt(boostDays, 10));
          }

          const { error: updateError } = await supabaseAdmin
            .from("car_listings")
            .update({
              boost_level: boostLevel,
              boost_expires_at: expiresAt.toISOString(),
              boost_warning_sent: false,
            })
            .eq("id", listingId);

          if (updateError) {
            logStep("ERROR activating boost", { error: updateError.message });
          } else {
            logStep("Boost activated", { listingId, expiresAt: expiresAt.toISOString() });
          }
        }

        // --- Subscription activation ---
        if (session.subscription && session.customer) {
          const userId = await resolveUserId(supabaseAdmin, stripe, session.customer);
          if (userId) {
            const subscription = await stripe.subscriptions.retrieve(
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id,
            );
            const productId = subscription.items.data[0]?.price?.product as string;
            const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

            const { error: upsertErr } = await supabaseAdmin
              .from("subscriptions")
              .upsert(
                {
                  user_id: userId,
                  stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer.id,
                  stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription.id,
                  product_id: productId,
                  status: "active",
                  current_period_end: subscriptionEnd,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" },
              );

            if (upsertErr) {
              logStep("ERROR upserting subscription", { error: upsertErr.message });
            } else {
              logStep("Subscription activated locally", { userId, productId, subscriptionEnd });
            }
          }
        }
        break;
      }

      // ──────────────────────────────────────────────
      // SUBSCRIPTION UPDATED → sync status
      // ──────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
        });

        const userId = await resolveUserId(supabaseAdmin, stripe, subscription.customer);
        if (userId) {
          const productId = subscription.items.data[0]?.price?.product as string;
          const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
              stripe_subscription_id: subscription.id,
              product_id: productId,
              status: subscription.status,
              current_period_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          logStep("Subscription synced", { userId, status: subscription.status });
        }
        break;
      }

      // ──────────────────────────────────────────────
      // SUBSCRIPTION DELETED → mark cancelled
      // ──────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled", {
          id: subscription.id,
          customer: subscription.customer,
        });

        const userId = await resolveUserId(supabaseAdmin, stripe, subscription.customer);
        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          logStep("Subscription marked canceled", { userId });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", {
          customer: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", {
          customer: invoice.customer,
          amount: invoice.amount_due,
        });

        // Mark subscription as past_due locally
        const failedUserId = await resolveUserId(supabaseAdmin, stripe, invoice.customer);
        if (failedUserId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("user_id", failedUserId);
          logStep("Subscription marked past_due", { userId: failedUserId });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
