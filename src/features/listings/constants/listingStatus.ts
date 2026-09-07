/**
 * Statuts d'une annonce — source unique, côté application.
 *
 * Il n'existe qu'UN SEUL état d'attente : `pending_review`. C'est celui
 * qu'écrit le déclencheur de sécurité `guard_sensitive_listing_updates` et
 * c'est désormais la valeur par défaut de la colonne en base. L'ancien mot
 * `pending` n'est plus une valeur autorisée par la contrainte de la table.
 *
 * Toute comparaison de statut d'annonce doit passer par ces constantes : deux
 * écritures littérales du même état finissent toujours par diverger.
 * @module features/listings/constants/listingStatus
 */

/** État d'une annonce déposée, en attente de modération. */
export const LISTING_STATUS_PENDING = "pending_review" as const;

/** Statuts autorisés en base (contrainte `car_listings_status_check`). */
export const LISTING_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "sold",
  "rejected",
  "archived",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Vrai si l'annonce attend une décision de modération. */
export function isPendingListing(status?: string | null): boolean {
  return (status ?? LISTING_STATUS_PENDING) === LISTING_STATUS_PENDING;
}

/** Nombre d'annonces en attente de modération (compteur du tableau de bord). */
export function countPendingListings<T extends { status?: string | null }>(
  listings: readonly T[],
): number {
  return listings.filter((l) => isPendingListing(l.status)).length;
}
