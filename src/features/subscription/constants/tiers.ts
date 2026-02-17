/**
 * Subscription tier definitions mapped to Stripe product/price IDs
 * @module features/subscription/constants
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
}

/** Free tier limit for particuliers without subscription */
export const FREE_PARTICULIER_LIMIT = 3;

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  particulier_plus: {
    name: 'Particulier+',
    slug: 'particulier_plus',
    price_id: 'price_1T0sAAFyYvJx8HZKWIhs6B3E',
    product_id: 'prod_TyppYB90qqa337',
    price: 14.99,
    maxListings: null,
    category: 'particulier',
    features: [
      'Annonces simultanées illimitées',
      'Messagerie prioritaire avec les acheteurs',
      'Statistiques de vues sur vos annonces',
      'Idéal pour les vendeurs réguliers',
    ],
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price_id: 'price_1T0s6eFyYvJx8HZKD5O9QOcF',
    product_id: 'prod_TypmmKAPYE3m1t',
    price: 50,
    maxListings: 30,
    popular: true,
    category: 'professionnel',
    features: [
      'Jusqu\'à 30 annonces simultanées',
      'Badge "Vendeur Pro" vérifié',
      'Statistiques avancées & tendances',
      'Support prioritaire 7j/7',
      'Mise en avant dans les résultats de recherche',
      'Alertes acheteurs ciblées',
    ],
  },
  premium: {
    name: 'Premium',
    slug: 'premium',
    price_id: 'price_1T0s70FyYvJx8HZKHhE4XAOV',
    product_id: 'prod_Typm0YXFdLkYZE',
    price: 200,
    maxListings: null,
    category: 'professionnel',
    features: [
      'Annonces simultanées illimitées',
      'Badge "Vendeur Premium" exclusif',
      'Statistiques complètes + export CSV',
      'Account manager VIP dédié',
      'Position #1 garantie dans les résultats',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Photos HD illimitées par annonce',
      'Intégration flux stock automatisée',
    ],
  },
};
