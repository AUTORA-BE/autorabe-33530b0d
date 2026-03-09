import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

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

    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) throw new Error("No stripe-signature header");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } else {
      event = JSON.parse(body) as Stripe.Event;
      logStep("WARNING: No webhook secret configured, skipping signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", {
          customer: session.customer,
          email: session.customer_email,
          subscription: session.subscription,
          metadata: session.metadata,
        });

        // Handle boost activation from metadata
        const listingId = session.metadata?.listing_id;
        const boostLevel = session.metadata?.boost_level;
        const boostDays = session.metadata?.boost_days;

        if (listingId && boostLevel && boostDays) {
          logStep("Activating boost", { listingId, boostLevel, boostDays });

          const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false } }
          );

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + parseInt(boostDays, 10));

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
            logStep("Boost activated successfully", { listingId, boostLevel, expiresAt: expiresAt.toISOString() });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled", {
          id: subscription.id,
          customer: subscription.customer,
        });
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
