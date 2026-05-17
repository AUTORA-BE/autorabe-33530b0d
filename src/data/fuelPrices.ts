/**
 * Static fuel prices fallback for the homepage section.
 * @module data/fuelPrices
 */

export type FuelTrend = 'up' | 'down';

export interface FuelPrice {
  id: 'diesel-b7' | 'essence-e10' | 'essence-e98' | 'electricite';
  label: string;
  price: number;
  unit: string;
  decimals: number;
  trend: FuelTrend;
  variation: number;
  iconColor: string;
  iconName: 'droplet' | 'flame' | 'zap';
  sparkline: number[];
}

export const FUEL_PRICES: FuelPrice[] = [
  {
    id: 'diesel-b7',
    label: 'Diesel B7',
    price: 1.650,
    unit: '€/L',
    decimals: 3,
    trend: 'down',
    variation: 0.8,
    iconColor: 'bg-red-500/10 text-red-500',
    iconName: 'droplet',
    sparkline: [1.72,1.71,1.70,1.71,1.69,1.68,1.69,1.67,1.66,1.67,1.66,1.65,1.66,1.65,1.64,1.65,1.66,1.65,1.64,1.65,1.66,1.65,1.66,1.65,1.66,1.65,1.66,1.65,1.65,1.65],
  },
  {
    id: 'essence-e10',
    label: 'Essence E10',
    price: 1.750,
    unit: '€/L',
    decimals: 3,
    trend: 'up',
    variation: 0.4,
    iconColor: 'bg-emerald-500/10 text-emerald-500',
    iconName: 'droplet',
    sparkline: [1.72,1.72,1.73,1.72,1.73,1.73,1.74,1.73,1.74,1.74,1.73,1.74,1.74,1.75,1.74,1.75,1.75,1.74,1.75,1.75,1.75,1.75,1.75,1.75,1.75,1.75,1.75,1.75,1.75,1.75],
  },
  {
    id: 'essence-e98',
    label: 'Essence E98',
    price: 1.850,
    unit: '€/L',
    decimals: 3,
    trend: 'up',
    variation: 0.6,
    iconColor: 'bg-orange-500/10 text-orange-500',
    iconName: 'flame',
    sparkline: [1.82,1.82,1.83,1.82,1.83,1.83,1.83,1.84,1.83,1.84,1.84,1.83,1.84,1.84,1.85,1.84,1.85,1.85,1.84,1.85,1.85,1.85,1.85,1.85,1.85,1.85,1.85,1.85,1.85,1.85],
  },
  {
    id: 'electricite',
    label: 'Électricité',
    price: 0.30,
    unit: '€/kWh',
    decimals: 2,
    trend: 'down',
    variation: 1.2,
    iconColor: 'bg-emerald-500/10 text-emerald-500',
    iconName: 'zap',
    sparkline: [0.34,0.34,0.33,0.34,0.33,0.33,0.32,0.33,0.32,0.32,0.31,0.32,0.31,0.31,0.30,0.31,0.30,0.30,0.31,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30],
  },
];
