/**
 * Catalogue autorisé côté serveur.
 * Les identifiants sont des `lookup_key` lisibles, stables entre test et live.
 */

/** Abonnements achetables en self-serve : lookup_key → slug de palier. */
export const SUBSCRIPTION_PRICES: Record<string, string> = {
  particulier_monthly: "particulier",
};

/** Boosts achetables : lookup_key → durée du boost. */
export const BOOST_PRICES: Record<string, { level: string; hours: number }> = {
  boost_24h: { level: "boost_24h", hours: 24 },
  boost_48h: { level: "boost_48h", hours: 48 },
  boost_72h: { level: "boost_72h", hours: 72 },
  boost_7d: { level: "boost_7d", hours: 168 },
};

/** Résout un `lookup_key` d'abonnement vers un slug de palier applicatif. */
export function tierSlugFromPriceKey(key: string | null | undefined): string | null {
  if (!key) return null;
  return SUBSCRIPTION_PRICES[key] ?? null;
}

/** Slugs de palier applicatifs (octrois manuels compris). */
export const TIER_SLUGS = ["particulier", "pro", "premium"] as const;

/**
 * Identifiants produit Stripe hérités → slug de palier.
 * Certaines lignes de `subscriptions` créées avant l'adoption des slugs
 * portent encore un `prod_…`. Source : `src/features/subscription/constants/tiers.ts`.
 */
export const LEGACY_PRODUCT_TIERS: Record<string, string> = {
  prod_VBzrk30V0HDldQ: "particulier",
  prod_UKno1VUDM4yfzP: "pro",
  prod_UKo0UuUbuB5vdq: "premium",
};

/** Résout une valeur stockée (slug moderne ou `prod_…` hérité) vers un slug de palier. */
export function tierSlugFromStoredProduct(value: string | null | undefined): string | null {
  if (!value) return null;
  if ((TIER_SLUGS as readonly string[]).includes(value)) return value;
  return LEGACY_PRODUCT_TIERS[value] ?? null;
}
