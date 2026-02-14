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
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  starter: {
    name: 'Starter',
    slug: 'starter',
    price_id: 'price_1T0s6KFyYvJx8HZKFKkgXzlH',
    product_id: 'prod_Typl0ZWwei0dEk',
    price: 19.90,
    maxListings: 5,
    features: [
      'Jusqu\'à 5 annonces actives',
      'Badge "Vendeur Pro"',
      'Statistiques de base',
      'Support par email',
    ],
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price_id: 'price_1T0s6eFyYvJx8HZKD5O9QOcF',
    product_id: 'prod_TypmmKAPYE3m1t',
    price: 39.90,
    maxListings: 20,
    popular: true,
    features: [
      'Jusqu\'à 20 annonces actives',
      'Badge "Vendeur Pro"',
      'Statistiques avancées',
      'Support prioritaire',
      'Mise en avant dans les résultats',
    ],
  },
  premium: {
    name: 'Premium',
    slug: 'premium',
    price_id: 'price_1T0s70FyYvJx8HZKHhE4XAOV',
    product_id: 'prod_Typm0YXFdLkYZE',
    price: 69.90,
    maxListings: null,
    features: [
      'Annonces illimitées',
      'Badge "Vendeur Pro Premium"',
      'Statistiques complètes + export',
      'Support VIP dédié',
      'Mise en avant prioritaire',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
  },
};
