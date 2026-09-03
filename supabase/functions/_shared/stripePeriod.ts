import Stripe from "https://esm.sh/stripe@18.5.0";

/**
 * L'API Stripe Basil a déplacé current_period_end de l'objet Subscription
 * vers les SubscriptionItem. Ce helper lit le nouvel emplacement,
 * avec repli sur l'ancien pour rester compatible.
 */
export function periodEndISO(subscription: Stripe.Subscription): string {
  const item = subscription.items?.data?.[0];
  // deno-lint-ignore no-explicit-any
  const ts = item?.current_period_end ?? (subscription as any).current_period_end;
  if (!ts) {
    throw new Error(`current_period_end introuvable sur l'abonnement ${subscription.id}`);
  }
  return new Date(ts * 1000).toISOString();
}
