/** Belgian TCO data - March 2026 (updated 15/03/2026) */

import type { FuelType, UsageType, AgeProfile, BonusMalus, Region, InsuranceType, EuroNorm } from '../types/tco.types';

export const PRIX_CARBURANT: Record<string, number> = {
  diesel: 1.720,
  essence95: 1.750,
  essence98: 1.816,
  electric_domicile: 0.36,
  electric_public: 0.56,
  gpl: 0.769,
};

export const FACTEUR_REALITE: Record<UsageType, Record<string, number>> = {
  ville: { diesel: 1.20, essence: 1.25, electric: 1.10 },
  mixte: { diesel: 1.10, essence: 1.15, electric: 1.05 },
  route: { diesel: 1.05, essence: 1.08, electric: 1.20 },
};

export const ENTRETIEN_BASE: Record<string, number> = {
  diesel: 980,
  essence95: 820,
  essence98: 820,
  electric: 350,
  hybridePHEV: 850,
  hybride: 720,
};

export const ASSURANCE_RC: Record<AgeProfile, number> = {
  jeune: 850,
  adulte: 520,
  senior: 650,
};

export const COEFF_BONUS: Record<BonusMalus, number> = {
  'bonus-3': 0.85,
  'bonus-2': 0.90,
  'bonus-1': 0.95,
  'neutre': 1.0,
  'malus+1': 1.15,
  'malus+2': 1.25,
};

export const MULT_COUVERTURE: Record<InsuranceType, number> = {
  rc: 1.0,
  mini_omnium: 1.8,
  omnium: 2.8,
};

export const TAXE_REGION: Record<Region, Record<string, number>> = {
  bruxelles: {
    diesel: 234,
    essence95: 117,
    essence98: 117,
    electric: 0,
    hybridePHEV: 85,
    hybride: 100,
  },
  flandre: {
    diesel: 245,
    essence95: 215,
    essence98: 215,
    electric: 0,
    hybridePHEV: 95,
    hybride: 110,
  },
  wallonie: {
    diesel: 228,
    essence95: 195,
    essence98: 195,
    electric: 0,
    hybridePHEV: 90,
    hybride: 105,
  },
};

export const DEPRECIATION: Record<string, number> = {
  diesel: 0.52,
  essence95: 0.45,
  essence98: 0.45,
  electric: 0.35,
  hybridePHEV: 0.40,
  hybride: 0.40,
};

export const PRIMES: Record<Region, Partial<Record<FuelType, number>>> = {
  bruxelles: {},
  flandre: {},
  wallonie: {},
};

export const FUEL_OPTIONS: { value: FuelType; label: string; icon: string; lucideIcon: string; price: string; badge: string; badgeColor: string }[] = [
  { value: 'diesel', label: 'Diesel B7', icon: '🛢️', lucideIcon: 'Droplets', price: '1.72€/L', badge: 'Plus cher', badgeColor: 'bg-orange-500/20 text-orange-400' },
  { value: 'essence95', label: 'Essence E10', icon: '⛽', lucideIcon: 'Flame', price: '1.75€/L', badge: 'Économique', badgeColor: 'bg-primary/20 text-primary' },
  { value: 'essence98', label: 'Essence E98', icon: '⛽', lucideIcon: 'Flame', price: '1.82€/L', badge: 'Premium', badgeColor: 'bg-blue-500/20 text-blue-400' },
  { value: 'electric', label: 'Électrique', icon: '🔋', lucideIcon: 'Zap', price: '0.36€/kWh', badge: 'Futur', badgeColor: 'bg-primary/20 text-primary' },
  { value: 'hybridePHEV', label: 'Hybride PHEV', icon: '🔌', lucideIcon: 'PlugZap', price: 'Mix', badge: 'Polyvalent', badgeColor: 'bg-violet-500/20 text-violet-400' },
  { value: 'hybride', label: 'Hybride HEV', icon: '⚡', lucideIcon: 'BatteryCharging', price: 'Mix', badge: 'Simple', badgeColor: 'bg-purple-500/20 text-purple-400' },
];

export const DEFAULT_CONSUMPTION: Record<FuelType, number> = {
  diesel: 5.8,
  essence95: 6.5,
  essence98: 6.5,
  electric: 17, // kWh/100km
  hybridePHEV: 2.5,
  hybride: 5.2,
};

export const EURO_NORMS: { value: EuroNorm; label: string }[] = [
  { value: 'euro6d', label: 'Euro 6d (2020+)' },
  { value: 'euro6', label: 'Euro 6 (2014+)' },
  { value: 'euro5', label: 'Euro 5 (2009+)' },
  { value: 'euro4', label: 'Euro 4 (2005+)' },
  { value: 'euro3', label: 'Euro 3 (2000+)' },
];
