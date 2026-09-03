/**
 * Subscription tier definitions mapped to Stripe product/price IDs
 * @module features/subscription/constants
 *
 * Offre réelle :
 * - Particulier Gratuit : 0€ — 3 annonces simultanées, 5 par mois
 * - Particulier : 25€/mois — 5 annonces simultanées, 12 par mois, dashboard
 * - Pro Garage / Premium : sur devis, activation manuelle par un admin
 *
 * Seul le palier `particulier` est achetable en self-serve (`purchasable: true`).
 * Pro & Premium exigent un numéro de TVA et une vérification (rendez-vous).
 */

export interface SubscriptionTier {
  name: string;
  slug: string;
  price_id: string;
  product_id: string;
  price: number;
  maxListings: number | null;
  /** Annonces créables sur 30 jours glissants (null = illimité) */
  maxListingsPerMonth: number | null;
  /** Achetable en self-serve. false = accordé manuellement après devis. */
  purchasable: boolean;
  features: string[];
  popular?: boolean;
  category: 'particulier' | 'professionnel';
  /** Whether this tier requires a TVA number */
  requiresTva: boolean;
  /** Whether this tier requires an appointment/verification */
  requiresAppointment: boolean;
  /** Badge label displayed on the seller's profile/listings */
  badge: string | null;
  /** Max photos per listing */
  maxPhotos: number;
  /** Daily message limit (null = unlimited) */
  messageLimitPerDay: number | null;
  /** Access to dashboard stats */
  hasDashboard: boolean;
  /** Ads shown */
  showAds: boolean;
  /** Extra listing cost after limit */
  extraListingPrice: number | null;
}

/** Free tier limit for particuliers without subscription */
export const FREE_PARTICULIER_LIMIT = 3;

/** Free tier daily message limit */
export const FREE_MESSAGE_LIMIT = 5;

/** Free tier max photos per listing */
export const FREE_MAX_PHOTOS = 5;

/** Extra listing cost for tiers with a cap */
export const EXTRA_LISTING_PRICE = 10;

/** Free tier rolling 30-day listing creation limit */
export const FREE_LISTINGS_PER_MONTH = 5;

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  particulier: {
    name: 'Particulier',
    slug: 'particulier',
    price_id: 'price_1UBbsGFyYvJx8HZKFZhyy1Sj',
    product_id: 'prod_VBzrk30V0HDldQ',
    price: 25,
    maxListings: 5,
    maxListingsPerMonth: 12,
    category: 'particulier',
    requiresTva: false,
    requiresAppointment: false,
    badge: null,
    maxPhotos: 30,
    messageLimitPerDay: 100,
    hasDashboard: true,
    showAds: false,
    extraListingPrice: null,
    purchasable: true,
    features: [
      '5 annonces simultanées',
      '12 annonces par mois',
      'Jusqu\'à 30 photos par annonce',
      'Messagerie étendue (100 messages/jour)',
      'Dashboard avec statistiques',
      'Sans publicité',
    ],
  },
  pro: {
    name: 'Pro Garage',
    slug: 'pro',
    price_id: 'price_1TM8CrFyYvJx8HZKEnPfyuAW',
    product_id: 'prod_UKno1VUDM4yfzP',
    price: 50,
    maxListings: 10,
    maxListingsPerMonth: 30,
    popular: true,
    category: 'professionnel',
    requiresTva: true,
    requiresAppointment: true,
    badge: 'Vendeur Vérifié',
    maxPhotos: 15,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    extraListingPrice: null,
    purchasable: false,
    features: [
      '10 annonces simultanées',
      '30 annonces par mois',
      'Badge "Vendeur Vérifié"',
      'Dashboard simple',
      'Messagerie illimitée',
      'Jusqu\'à 15 photos par annonce',
      'Support prioritaire 7j/7',
      'Numéro TVA requis',
    ],
  },
  premium: {
    name: 'Premium',
    slug: 'premium',
    price_id: 'price_1TM8OVFyYvJx8HZKsANQJFDl',
    product_id: 'prod_UKo0UuUbuB5vdq',
    price: 250,
    maxListings: null,
    maxListingsPerMonth: null,
    category: 'professionnel',
    requiresTva: true,
    requiresAppointment: true,
    badge: 'Premium',
    maxPhotos: 50,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    extraListingPrice: null,
    purchasable: false,
    features: [
      'Annonces illimitées',
      'Alertes "Bon Plan"',
      'Badge "Premium" exclusif',
      'Support 24h/24',
      'Messagerie prioritaire',
      'Dashboard Pro complet + export CSV',
      'Vitrine de garage dédiée',
      'Accès anticipé aux nouveautés',
      'Numéro TVA requis',
    ],
  },
};

/**
 * Helper to get the free tier feature list
 */
export const FREE_TIER_FEATURES = [
  `${FREE_PARTICULIER_LIMIT} annonces simultanées`,
  `${FREE_LISTINGS_PER_MONTH} annonces par mois`,
  `Jusqu'à ${FREE_MAX_PHOTOS} photos par annonce`,
  `Messagerie limitée (${FREE_MESSAGE_LIMIT} messages/jour)`,
  'Recherche et comparaison',
];
