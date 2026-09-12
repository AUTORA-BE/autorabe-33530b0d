/**
 * Contrat entre les quotas d'annonces appliqués par le serveur et les paliers
 * affichés aux utilisateurs.
 *
 * Le bug que ces tests figent : la table de quotas de `create-listing` n'était
 * indexée que sur les anciens identifiants Stripe (`prod_…`), alors que
 * `payments-webhook` — seul code qui écrit `public.subscriptions` — y met le
 * **slug** du palier. Résultat : `LIMITS['particulier']` valait `undefined` et
 * tout abonné payant retombait sur le quota gratuit (3 simultanées / 5 par mois
 * au lieu de 5 / 12), un Premium censé être illimité aussi.
 */

import { describe, it, expect } from 'vitest';
import {
  listingQuotaFor,
  LISTING_QUOTAS,
  FREE_LISTING_QUOTA,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from '../../../supabase/functions/_shared/catalog';
import {
  SUBSCRIPTION_TIERS,
  FREE_PARTICULIER_LIMIT,
  FREE_LISTINGS_PER_MONTH,
} from './constants/tiers';

/** Une période encore en cours, pour ne pas dépendre de la date du jour. */
const FUTUR = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
const PASSE = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

describe('listingQuotaFor — ce que payments-webhook écrit réellement', () => {
  it('un abonné Particulier (slug) obtient 5 simultanées et 12 par mois', () => {
    expect(listingQuotaFor({ product_id: 'particulier', status: 'active', current_period_end: FUTUR }))
      .toEqual({ simultaneous: 5, perMonth: 12 });
  });

  it('un abonné Pro (slug) obtient 10 et 30', () => {
    expect(listingQuotaFor({ product_id: 'pro', status: 'active', current_period_end: FUTUR }))
      .toEqual({ simultaneous: 10, perMonth: 30 });
  });

  it('un abonné Premium (slug) est illimité', () => {
    expect(listingQuotaFor({ product_id: 'premium', status: 'active', current_period_end: FUTUR }))
      .toEqual({ simultaneous: null, perMonth: null });
  });

  it('les identifiants produit Stripe hérités donnent le même quota que leur slug', () => {
    for (const slug of ['particulier', 'pro', 'premium'] as const) {
      const legacy = SUBSCRIPTION_TIERS[slug].product_id;
      expect(listingQuotaFor({ product_id: legacy, status: 'active', current_period_end: FUTUR }))
        .toEqual(listingQuotaFor({ product_id: slug, status: 'active', current_period_end: FUTUR }));
    }
  });
});

describe('listingQuotaFor — repli sur le palier gratuit', () => {
  it('aucune ligne d\'abonnement', () => {
    expect(listingQuotaFor(null)).toEqual(FREE_LISTING_QUOTA);
    expect(listingQuotaFor(undefined)).toEqual(FREE_LISTING_QUOTA);
  });

  it('statut inactif (canceled, incomplete, sans statut)', () => {
    expect(listingQuotaFor({ product_id: 'premium', status: 'canceled' })).toEqual(FREE_LISTING_QUOTA);
    expect(listingQuotaFor({ product_id: 'premium', status: 'incomplete' })).toEqual(FREE_LISTING_QUOTA);
    expect(listingQuotaFor({ product_id: 'premium', status: null })).toEqual(FREE_LISTING_QUOTA);
  });

  it('période terminée, même avec un statut actif', () => {
    expect(listingQuotaFor({ product_id: 'pro', status: 'active', current_period_end: PASSE }))
      .toEqual(FREE_LISTING_QUOTA);
  });

  it('palier inconnu, sans jamais offrir l\'illimité par accident', () => {
    expect(listingQuotaFor({ product_id: 'palier_inconnu', status: 'active' })).toEqual(FREE_LISTING_QUOTA);
    expect(listingQuotaFor({ product_id: null, status: 'active' })).toEqual(FREE_LISTING_QUOTA);
  });

  it('période absente = abonnement sans échéance, le quota payant s\'applique', () => {
    expect(listingQuotaFor({ product_id: 'particulier', status: 'active' }))
      .toEqual({ simultaneous: 5, perMonth: 12 });
  });
});

describe('listingQuotaFor — statuts considérés comme actifs', () => {
  it('trialing et past_due gardent le quota payant, comme dans check-subscription', () => {
    for (const status of ACTIVE_SUBSCRIPTION_STATUSES) {
      expect(listingQuotaFor({ product_id: 'particulier', status, current_period_end: FUTUR }))
        .toEqual({ simultaneous: 5, perMonth: 12 });
    }
    expect(ACTIVE_SUBSCRIPTION_STATUSES).toEqual(['active', 'trialing', 'past_due']);
  });
});

/**
 * Garde-fou anti-dérive : les quotas serveur recopient `tiers.ts`. Si un palier
 * change d'un côté sans l'autre, l'UI et le serveur ne disent plus la même chose.
 */
describe('contrat avec tiers.ts', () => {
  it('chaque palier serveur correspond au palier affiché', () => {
    for (const slug of ['particulier', 'pro', 'premium'] as const) {
      expect(LISTING_QUOTAS[slug]).toEqual({
        simultaneous: SUBSCRIPTION_TIERS[slug].maxListings,
        perMonth: SUBSCRIPTION_TIERS[slug].maxListingsPerMonth,
      });
    }
  });

  it('le palier gratuit serveur correspond aux constantes du gratuit', () => {
    expect(FREE_LISTING_QUOTA).toEqual({
      simultaneous: FREE_PARTICULIER_LIMIT,
      perMonth: FREE_LISTINGS_PER_MONTH,
    });
  });
});
