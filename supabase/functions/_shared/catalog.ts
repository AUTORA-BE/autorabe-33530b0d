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

/**
 * Statuts Stripe qui valent « abonnement en cours ».
 * Même liste que `check-subscription` : un essai ou un impayé récent garde
 * l'accès payant, sinon un abonné en essai retomberait sur le palier gratuit.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

/** Quotas d'annonces d'un palier (`null` = illimité). */
export interface ListingQuota {
  simultaneous: number | null;
  perMonth: number | null;
}

/** Palier gratuit : aucun abonnement en cours. Source : `FREE_PARTICULIER_LIMIT` / `FREE_LISTINGS_PER_MONTH`. */
export const FREE_LISTING_QUOTA: ListingQuota = { simultaneous: 3, perMonth: 5 };

/**
 * Quotas par slug de palier.
 * Source : `src/features/subscription/constants/tiers.ts` (`maxListings`,
 * `maxListingsPerMonth`). Figé par `src/features/subscription/listingQuota.test.ts`.
 */
export const LISTING_QUOTAS: Record<string, ListingQuota> = {
  particulier: { simultaneous: 5, perMonth: 12 },
  pro: { simultaneous: 10, perMonth: 30 },
  premium: { simultaneous: null, perMonth: null },
};

/** Ligne de `public.subscriptions` utile au calcul du quota. */
export interface SubscriptionRow {
  product_id?: string | null;
  status?: string | null;
  current_period_end?: string | null;
}

/**
 * Quotas d'annonces applicables à une ligne `subscriptions`.
 *
 * `product_id` peut être un slug moderne (ce qu'écrit `payments-webhook`) ou un
 * `prod_…` Stripe hérité : les deux sont résolus. Tout le reste — ligne absente,
 * statut inactif, période terminée, palier inconnu — retombe sur le gratuit.
 */
export function listingQuotaFor(row: SubscriptionRow | null | undefined): ListingQuota {
  if (!row?.status || !ACTIVE_SUBSCRIPTION_STATUSES.includes(row.status)) {
    return FREE_LISTING_QUOTA;
  }
  if (row.current_period_end && new Date(row.current_period_end) <= new Date()) {
    return FREE_LISTING_QUOTA;
  }
  const slug = tierSlugFromStoredProduct(row.product_id);
  return (slug ? LISTING_QUOTAS[slug] : undefined) ?? FREE_LISTING_QUOTA;
}
