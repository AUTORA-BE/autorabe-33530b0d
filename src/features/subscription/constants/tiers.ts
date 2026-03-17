/**
 * Subscription tier definitions mapped to Stripe product/price IDs
 * @module features/subscription/constants
 * 
 * Tier structure:
 * - Particulier: Gratuit (3 annonces) | Particulier+ €14.99/mo (illimité, sans pub, dashboard)
 * - Professionnel: Pro €50/mo (10 annonces, dashboard) | Premium €249/mo (tout illimité)
 * 
 * Pro & Premium require TVA number + appointment verification.
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
}

/** Free tier limit for particuliers without subscription */
export const FREE_PARTICULIER_LIMIT = 3;

/** Free tier daily message limit */
export const FREE_MESSAGE_LIMIT = 5;

/** Free tier max photos per listing */
export const FREE_MAX_PHOTOS = 5;

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  particulier_plus: {
    name: 'Particulier+',
    slug: 'particulier_plus',
    price_id: 'price_1T0sAAFyYvJx8HZKWIhs6B3E',
    product_id: 'prod_TyppYB90qqa337',
    price: 14.99,
    maxListings: null,
    category: 'particulier',
    requiresTva: false,
    requiresAppointment: false,
    badge: null,
    maxPhotos: 10,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    features: [
      'Annonces simultanées illimitées',
      'Sans publicité',
      'Dashboard avec statistiques de vues',
      'Messagerie illimitée',
      'Jusqu\'à 10 photos par annonce',
      'Idéal pour les vendeurs réguliers',
    ],
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price_id: 'price_1T0s6eFyYvJx8HZKD5O9QOcF',
    product_id: 'prod_TypmmKAPYE3m1t',
    price: 50,
    maxListings: 10,
    popular: true,
    category: 'professionnel',
    requiresTva: true,
    requiresAppointment: true,
    badge: 'Vendeur Pro',
    maxPhotos: 15,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    features: [
      'Jusqu\'à 10 annonces simultanées',
      'Badge "Vendeur Pro" vérifié',
      'Dashboard avec statistiques',
      'Messagerie prioritaire illimitée',
      'Jusqu\'à 15 photos par annonce',
      'Support prioritaire 7j/7',
      'Numéro TVA requis',
    ],
  },
  premium: {
    name: 'Premium',
    slug: 'premium',
    price_id: 'price_1TAyExFyYvJx8HZKzy5WhV0l',
    product_id: 'prod_U9Gmx0BN0nenTW',
    price: 249,
    maxListings: null,
    category: 'professionnel',
    requiresTva: true,
    requiresAppointment: true,
    badge: 'Vendeur Premium',
    maxPhotos: 50,
    messageLimitPerDay: null,
    hasDashboard: true,
    showAds: false,
    features: [
      'Annonces simultanées illimitées',
      'Badge "Vendeur Premium" exclusif',
      'Dashboard complet + export CSV',
      'Account manager VIP dédié',
      'Position #1 garantie dans les résultats',
      'Photos HD illimitées par annonce',
      'Intégration flux stock automatisée',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Numéro TVA requis',
    ],
  },
};

/**
 * Helper to get the free tier feature list
 */
export const FREE_TIER_FEATURES = [
  `Jusqu'à ${FREE_PARTICULIER_LIMIT} annonces simultanées`,
  'Messagerie intégrée (5 messages/jour)',
  `Jusqu'à ${FREE_MAX_PHOTOS} photos par annonce`,
  'Recherche et comparaison basiques',
  'Aucun engagement, aucune carte requise',
];
