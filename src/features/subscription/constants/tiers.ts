/**
 * Subscription tier definitions mapped to Stripe product/price IDs
 * @module features/subscription/constants
 *
 * Tier structure:
 * - Particulier Gratuit: 0€ (3 annonces/mois, puis 10€/annonce)
 * - Particulier Boost: 20€/mo (10 annonces/mois, puis 10€/annonce)
 * - Pro Garage: 50€/mo (10 annonces/mois, badge Vérifié)
 * - Premium: 250€/mo (illimité, badge Premium, support 24/7)
 * - BOSS: Sur mesure (concessions multiples)
 *
 * Pro, Premium & BOSS require TVA number + appointment verification.
 */

export interface SubscriptionTier {
  name: string;
  slug: string;
  price_id: string;
  product_id: string;
  price: number;
  maxListings: number | null;
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

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  boost: {
    name: 'Particulier Boost',
    slug: 'boost',
    price_id: 'price_1TMBobFyYvJx8HZKkD5EbQpY',
    product_id: 'prod_UKrX4ZTLz0ITfq',
    price: 20,
    maxListings: 10,
    category: 'particulier',
    requiresTva: false,
    requiresAppointment: false,
    badge: null,
    maxPhotos: 10,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    extraListingPrice: EXTRA_LISTING_PRICE,
    features: [
      '10 annonces/mois (puis 10€/annonce)',
      'Messagerie illimitée',
      'Dashboard avec statistiques',
      'Recherche et comparaison avancées',
      'Jusqu\'à 10 photos par annonce',
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
    popular: true,
    category: 'professionnel',
    requiresTva: true,
    requiresAppointment: true,
    badge: 'Vendeur Vérifié',
    maxPhotos: 15,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    extraListingPrice: EXTRA_LISTING_PRICE,
    features: [
      '10 annonces/mois (puis 10€/annonce)',
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
    category: 'professionnel',
    requiresTva: true,
    requiresAppointment: true,
    badge: 'Premium',
    maxPhotos: 50,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    extraListingPrice: null,
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
  `${FREE_PARTICULIER_LIMIT} annonces/mois (puis 10€/annonce)`,
  'Dashboard simple',
  'Messagerie limitée (5 messages/jour)',
  'Recherche et comparaison',
  `Jusqu'à ${FREE_MAX_PHOTOS} photos par annonce`,
];
