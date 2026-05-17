/**
 * Static fuel prices fallback for the homepage section.
 * Structure prête à être branchée à Supabase (table `fuel_prices`) plus tard.
 * @module data/fuelPrices
 */

export interface FuelPriceEntry {
  key: 'diesel' | 'essence95' | 'essence98' | 'electric';
  label: string;
  price: number;
  unit: string;
  /** Variation en % sur 30 jours (positive = hausse) */
  variation: number;
  /** Série 30 derniers jours pour sparkline */
  series: number[];
}

export const FUEL_PRICES: FuelPriceEntry[] = [
  {
    key: 'diesel',
    label: 'Diesel B7',
    price: 1.650,
    unit: '€/L',
    variation: -0.8,
    series: [1.71, 1.70, 1.71, 1.69, 1.70, 1.69, 1.68, 1.68, 1.69, 1.67, 1.68, 1.67, 1.66, 1.67, 1.66, 1.66, 1.65, 1.66, 1.65, 1.65, 1.64, 1.65, 1.65, 1.64, 1.65, 1.65, 1.65, 1.65, 1.65, 1.65],
  },
  {
    key: 'essence95',
    label: 'Essence E10 (95)',
    price: 1.750,
    unit: '€/L',
    variation: 0.4,
    series: [1.74, 1.74, 1.74, 1.74, 1.74, 1.74, 1.75, 1.74, 1.75, 1.75, 1.74, 1.75, 1.75, 1.75, 1.75, 1.75, 1.75, 1.75, 1.75, 1.76, 1.75, 1.75, 1.75, 1.75, 1.75, 1.75, 1.76, 1.75, 1.75, 1.75],
  },
  {
    key: 'essence98',
    label: 'Essence E98',
    price: 1.850,
    unit: '€/L',
    variation: 0.6,
    series: [1.83, 1.83, 1.84, 1.83, 1.84, 1.84, 1.84, 1.84, 1.85, 1.84, 1.84, 1.84, 1.85, 1.84, 1.85, 1.85, 1.85, 1.85, 1.85, 1.85, 1.85, 1.85, 1.86, 1.85, 1.85, 1.85, 1.85, 1.85, 1.85, 1.85],
  },
  {
    key: 'electric',
    label: 'Électricité (domicile)',
    price: 0.30,
    unit: '€/kWh',
    variation: -1.2,
    series: [0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.30, 0.31, 0.31, 0.30, 0.30, 0.31, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30],
  },
];
