/** TCO Calculator types */

export type FuelType = 'diesel' | 'essence95' | 'essence98' | 'electric' | 'hybridePHEV' | 'hybride';
export type UsageType = 'ville' | 'mixte' | 'route';
export type AgeProfile = 'jeune' | 'adulte' | 'senior';
export type BonusMalus = 'bonus-3' | 'bonus-2' | 'bonus-1' | 'neutre' | 'malus+1' | 'malus+2';
export type Region = 'bruxelles' | 'flandre' | 'wallonie';
export type InsuranceType = 'rc' | 'mini_omnium' | 'omnium';
export type EuroNorm = 'euro3' | 'euro4' | 'euro5' | 'euro6' | 'euro6d';

export interface TcoFormData {
  fuelType: FuelType;
  price: number;
  year: number;
  usage: UsageType;
  kmPerYear: number;
  ageProfile: AgeProfile;
  bonusMalus: BonusMalus;
  region: Region;
  insuranceType: InsuranceType;
  fiscalPower: number;
  horsepower: number;
  consumption: number;
  euroNorm: EuroNorm;
}

export interface TcoBreakdown {
  prixAchat: number;
  carburant: number;
  entretien: number;
  assurance: number;
  taxe: number;
  depreciation: number;
  prime: number;
  total: number;
  mensuel: number;
  details: {
    consoReelle: number;
    litresTotal: number;
    prixLitre: number;
    facteurRealite: number;
    assuranceAnnuelle: number;
    entretienAnnuel: number;
    taxeAnnuelle: number;
  };
}

export interface TcoAlternative {
  fuelType: FuelType;
  label: string;
  breakdown: TcoBreakdown;
  economie: number;
}
