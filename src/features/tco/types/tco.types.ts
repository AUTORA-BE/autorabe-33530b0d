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
  /**
   * Taxe de circulation sur 5 ans. `null` = non calculée (le moteur fiscal ne
   * tranche pas pour ce véhicule) : elle est alors EXCLUE de `total`, jamais
   * comptée comme 0 €.
   */
  taxe: number | null;
  /** Motif du non-calcul, formulé par le moteur fiscal. `null` si la taxe est calculée. */
  motifTaxeNonCalculee: string | null;
  depreciation: number;
  prime: number;
  /** Coût total sur 5 ans — hors taxe de circulation quand `taxe` est null. */
  total: number;
  /** Coût total sur 5 ans sans la taxe de circulation (comparaisons à base égale). */
  totalHorsTaxe: number;
  mensuel: number;
  details: {
    consoReelle: number;
    litresTotal: number;
    prixLitre: number;
    facteurRealite: number;
    assuranceAnnuelle: number;
    entretienAnnuel: number;
    /** `null` = taxe de circulation non calculée (voir `motifTaxeNonCalculee`). */
    taxeAnnuelle: number | null;
  };
}

export interface TcoAlternative {
  fuelType: FuelType;
  label: string;
  breakdown: TcoBreakdown;
  economie: number;
  /**
   * true quand la taxe de circulation n'est pas calculée d'un côté au moins :
   * l'économie est alors comparée hors taxe de circulation des deux côtés.
   */
  economieHorsTaxe: boolean;
}
