/**
 * Boost tier constants (affichage uniquement).
 *
 * Aucun identifiant de prix Stripe ici : `create-boost-checkout` résout le prix
 * côté serveur à partir de la clé de palier (`id`) et de variables d'environnement.
 * @module features/listings/constants
 */

export interface BoostTier {
  id: string;
  name: string;
  price: number;
  productId: string;
  days: number;
  hours: number;
  features: string[];
  icon: string;
  accent: string;
  popular?: boolean;
}

export const BOOST_TIERS: BoostTier[] = [
  {
    id: "boost_24h",
    name: "24 heures",
    price: 4,
    productId: "prod_UKrbiBhkECI3jI",
    days: 1,
    hours: 24,
    features: [
      "En haut des résultats pendant 24h",
      "Badge « Sponsorisé »",
    ],
    icon: "⚡",
    accent: "border-blue-400",
  },
  {
    id: "boost_48h",
    name: "48 heures",
    price: 7,
    productId: "prod_UKrbMXgDMbDw9F",
    days: 2,
    hours: 48,
    features: [
      "En haut des résultats pendant 48h",
      "Badge « Sponsorisé »",
      "Bordure mise en avant",
    ],
    icon: "🚀",
    accent: "border-violet-400",
  },
  {
    id: "boost_72h",
    name: "72 heures",
    price: 10,
    productId: "prod_UKrcw5ZCbrnIQV",
    days: 3,
    hours: 72,
    features: [
      "En haut des résultats pendant 72h",
      "Badge « Sponsorisé » doré",
      "Bordure premium dorée",
    ],
    icon: "🔥",
    accent: "border-amber-400",
    popular: true,
  },
  {
    id: "boost_7d",
    name: "7 jours",
    price: 18,
    productId: "prod_UKrcUahu04peY3",
    days: 7,
    hours: 168,
    features: [
      "En haut des résultats pendant 7 jours",
      "Badge « Vendeur de confiance »",
      "Bordure ultra premium",
      "Visibilité maximale",
    ],
    icon: "💎",
    accent: "border-primary",
  },
];
