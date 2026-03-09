/**
 * Boost tier constants mapped to Stripe product/price IDs
 * @module features/listings/constants
 */

export interface BoostTier {
  id: string;
  name: string;
  price: number;
  priceId: string | null;
  productId: string | null;
  days: number;
  features: string[];
  icon: string;
  accent: string;
}

export const BOOST_TIERS: BoostTier[] = [
  {
    id: "standard",
    name: "Standard",
    price: 0,
    priceId: null,
    productId: null,
    days: 3,
    features: [
      "Mise en avant pendant 3 jours",
      "Badge « Sponsorisé »",
    ],
    icon: "⭐",
    accent: "border-border",
  },
  {
    id: "premium",
    name: "Premium",
    price: 5,
    priceId: "price_1T8t06FyYvJx8HZKs8VorS1T",
    productId: "prod_U77EDXIuiJiZjX",
    days: 7,
    features: [
      "En haut des résultats pendant 7 jours",
      "Badge « Sponsorisé » doré",
      "Bordure premium dorée",
    ],
    icon: "🚀",
    accent: "border-amber-400",
  },
  {
    id: "ultra",
    name: "Ultra",
    price: 10,
    priceId: "price_1T8t0jFyYvJx8HZKdirmzWBT",
    productId: "prod_U77FWLCrfB1Tk6",
    days: 14,
    features: [
      "En haut des résultats pendant 14 jours",
      "Badge « Vendeur de confiance »",
      "Photos HD automatiques",
      "Bordure ultra premium",
    ],
    icon: "💎",
    accent: "border-primary",
  },
];
