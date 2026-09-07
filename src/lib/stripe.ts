import { loadStripe, type Stripe } from "@stripe/stripe-js";

/** Jeton client publiable, injecté à la construction. */
const CLIENT_TOKEN = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export type StripeEnv = "sandbox" | "live";

/** `pk_test_…` = environnement de test, `pk_live_…` = production. */
export function getStripeEnvironment(): StripeEnv {
  return CLIENT_TOKEN?.startsWith("pk_live_") ? "live" : "sandbox";
}

export function isTestMode(): boolean {
  return getStripeEnvironment() === "sandbox";
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!CLIENT_TOKEN) {
    console.error("VITE_PAYMENTS_CLIENT_TOKEN is not configured");
    return Promise.resolve(null);
  }
  if (!stripePromise) stripePromise = loadStripe(CLIENT_TOKEN);
  return stripePromise;
}
