/**
 * Fiscalité automobile belge — TMC / BIV et taxe de circulation.
 *
 * Les tables `belgian_tmc_brackets` et `belgian_annual_tax_brackets` en base
 * contenaient un barème UNIQUE, copié à l'identique pour les trois régions,
 * fondé sur les chevaux fiscaux et non indexé. Or :
 *   - la Wallonie a ABANDONNÉ le calcul aux CV le 01/07/2025 ;
 *   - la Flandre calcule depuis 2012 sur une formule CO₂ / Euronorme / âge ;
 *   - Bruxelles utilise deux grilles (CV et kW) dont on retient la plus élevée ;
 *   - les montants 61,50 → 4 957 € qui figuraient en base sont en réalité le
 *     barème NATIONAL FIGÉ DES VÉHICULES EN LEASING, pas celui des particuliers.
 *
 * Barèmes en vigueur du 01/07/2026 au 30/06/2027, vérifiés le 6 août 2026
 * auprès d'Autogids / Moniteur Automobile (mise à jour 01/07/2026), du SPW
 * Finances et de MyTax / Bruxelles Fiscalité.
 *
 * ⚠️ CES BARÈMES SONT INDEXÉS CHAQUE 1er JUILLET.
 */

export const BAREME_VALIDE_DEPUIS = "2026-07-01";
export const BAREME_VALIDE_JUSQUAU = "2027-06-30";

export type Region = "bruxelles" | "wallonie" | "flandre";
export type Carburant = "essence" | "diesel" | "hybride" | "electrique" | "lpg" | "cng" | "hydrogene";
export type CycleCO2 = "WLTP" | "NEDC";

export interface VehiculeFiscal {
  region: Region;
  puissanceKw?: number | null;
  puissanceCv?: number | null;
  co2?: number | null;
  cycleCO2?: CycleCO2;
  mma?: number | null;
  carburant: Carburant;
  euroNorm?: string | null;
  ageAnnees: number;
  reductionFamille?: boolean;
}

export interface ResultatTaxe {
  montant: number | null;
  detail: string[];
  donneesManquantes: string[];
  approximatif: boolean;
  source: string;
}

interface GrilleBxl { kwMax: number; cvMax: number; montant: number; montantLpg: number }

const BXL_TMC: GrilleBxl[] = [
  { kwMax: 70,       cvMax: 8,   montant: 78.88,   montantLpg: 0 },
  { kwMax: 85,       cvMax: 10,  montant: 157.76,  montantLpg: 0 },
  { kwMax: 100,      cvMax: 11,  montant: 634.89,  montantLpg: 252.67 },
  { kwMax: 110,      cvMax: 14,  montant: 1112.01, montantLpg: 729.80 },
  { kwMax: 120,      cvMax: 15,  montant: 1589.14, montantLpg: 1206.93 },
  { kwMax: 155,      cvMax: 17,  montant: 3178.28, montantLpg: 2796.07 },
  { kwMax: Infinity, cvMax: Infinity, montant: 6357.85, montantLpg: 5975.63 },
];

const BXL_TMC_MINIMUM = 78.88;

const BXL_DEGRESSIVITE: Array<{ ageMax: number; pct: number }> = [
  { ageMax: 1, pct: 1.00 }, { ageMax: 2, pct: 0.90 }, { ageMax: 3, pct: 0.80 },
  { ageMax: 4, pct: 0.70 }, { ageMax: 5, pct: 0.60 }, { ageMax: 6, pct: 0.50 },
  { ageMax: 7, pct: 0.40 }, { ageMax: 8, pct: 0.30 }, { ageMax: 9, pct: 0.20 },
  { ageMax: Infinity, pct: 0.10 },
];

const WAL_BB: Array<{ kwMax: number; bb: number }> = [
  { kwMax: 70,  bb: 64.01 },   { kwMax: 85,  bb: 128.02 },
  { kwMax: 100, bb: 515.20 },  { kwMax: 110, bb: 902.37 },
  { kwMax: 120, bb: 1289.55 }, { kwMax: 155, bb: 2579.10 },
  { kwMax: Infinity, bb: 5159.25 },
];

const WAL_MASSE_REFERENCE = 1838;
const WAL_MIN = 50;
const WAL_MAX = 9000;
const WAL_MIN_OCCASION = 61.50;

const WAL_DEGRESSIVITE: Record<number, number> = {
  0: 1.00, 1: 0.90, 2: 0.80, 3: 0.70, 4: 0.60, 5: 0.55, 6: 0.50, 7: 0.45,
  8: 0.40, 9: 0.35, 10: 0.30, 11: 0.25, 12: 0.20, 13: 0.15, 14: 0.10,
};

function walCoefficientEnergie(carburant: Carburant, kw: number): number {
  if (carburant === "hybride") return 0.80;
  if (carburant === "electrique" || carburant === "hydrogene") {
    if (kw <= 120) return 0.01;
    if (kw <= 155) return 0.10;
    if (kw <= 249) return 0.18;
    return 0.26;
  }
  return 1.00;
}

const VLA_Q = 1.245;

function vlaFacteurCarburant(carburant: Carburant): number {
  if (carburant === "lpg") return 0.88;
  if (carburant === "cng") return 0.93;
  return 1.0;
}

/**
 * Composante air c. Valeurs de base légales, indexées chaque 1er juillet.
 * Le coefficient 2026-2027 est déduit du seul point officiel publié :
 * Euro 6 essence vaut 28,54 € pour une base de 20,61 €, soit 1,3848.
 * Les valeurs Euro 0 à 3 ne sont pas publiées : on applique la valeur Euro 4,
 * la plus élevée connue, et on signale l'approximation.
 */
const VLA_INDEXATION_2026 = 1.3848;

const VLA_C_BASE: Record<"diesel" | "autre", Record<string, number>> = {
  diesel: { euro4: 467.06, euro5: 459.35, euro6: 454.07 },
  autre:  { euro4: 22.93,  euro5: 20.61,  euro6: 20.61 },
};

const VLA_LC: Record<number, number> = {
  0: 1.00, 1: 0.90, 2: 0.80, 3: 0.70, 4: 0.60, 5: 0.54, 6: 0.48, 7: 0.42,
  8: 0.36, 9: 0.30, 10: 0.24, 11: 0.18, 12: 0.12, 13: 0.06, 14: 0.01,
};

const VLA_MINIMUM_EV = 61.50;

function normaliserEuro(euroNorm?: string | null): "euro4" | "euro5" | "euro6" | "inferieur" | null {
  if (!euroNorm) return null;
  const n = euroNorm.toLowerCase().replace(/\s+/g, "");
  if (n.includes("6")) return "euro6";
  if (n.includes("5")) return "euro5";
  if (n.includes("4")) return "euro4";
  if (/[0-3]/.test(n)) return "inferieur";
  return null;
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

export function calculerTMC(v: VehiculeFiscal): ResultatTaxe {
  const manquantes: string[] = [];
  const detail: string[] = [];
  const estElectrique = v.carburant === "electrique" || v.carburant === "hydrogene";

  if (v.region === "bruxelles") {
    const source = "Bruxelles Fiscalité / MyTax — barème 01/07/2026 au 30/06/2027";

    if (estElectrique) {
      detail.push("Électrique ou hydrogène : tarif minimum bruxellois");
      return { montant: BXL_TMC_MINIMUM, detail, donneesManquantes: [], approximatif: false, source };
    }

    if (!v.puissanceKw && !v.puissanceCv) {
      return { montant: null, detail, donneesManquantes: ["puissance en kW", "puissance fiscale en CV"], approximatif: false, source };
    }

    const parKw = v.puissanceKw ? BXL_TMC.find((g) => v.puissanceKw! <= g.kwMax)! : null;
    const parCv = v.puissanceCv ? BXL_TMC.find((g) => v.puissanceCv! <= g.cvMax)! : null;
    const estLpg = v.carburant === "lpg";
    const montantKw = parKw ? (estLpg ? parKw.montantLpg : parKw.montant) : 0;
    const montantCv = parCv ? (estLpg ? parCv.montantLpg : parCv.montant) : 0;
    let base = Math.max(montantKw, montantCv);

    if (parKw) detail.push(`Grille kW (${v.puissanceKw} kW) : ${arrondi(montantKw)} €`);
    if (parCv) detail.push(`Grille CV (${v.puissanceCv} CV) : ${arrondi(montantCv)} €`);
    detail.push(`Bruxelles retient le montant le plus élevé : ${arrondi(base)} €`);
    if (!v.puissanceCv) manquantes.push("puissance fiscale en CV (seul le barème kW est appliqué)");

    const deg = BXL_DEGRESSIVITE.find((d) => v.ageAnnees < d.ageMax)!;
    base = base * deg.pct;
    detail.push(`Dégressivité : ${v.ageAnnees} an(s) → ${Math.round(deg.pct * 100)} % → ${arrondi(base)} €`);

    if (v.reductionFamille) { base -= 250; detail.push("Réduction famille : −250 €"); }

    const montant = Math.max(BXL_TMC_MINIMUM, arrondi(base));
    if (montant === BXL_TMC_MINIMUM) detail.push(`Plancher bruxellois appliqué : ${BXL_TMC_MINIMUM} €`);

    return { montant, detail, donneesManquantes: manquantes, approximatif: manquantes.length > 0, source };
  }

  if (v.region === "wallonie") {
    const source = "SPW Finances — formule en vigueur depuis le 01/07/2025, barème 2026-2027";

    if (!v.puissanceKw) manquantes.push("puissance en kW");
    if (!v.co2 && !estElectrique) manquantes.push("émissions CO₂ (g/km)");
    if (!v.mma) manquantes.push("masse maximale autorisée (kg)");
    if (manquantes.length > 0) {
      return { montant: null, detail, donneesManquantes: manquantes, approximatif: false, source };
    }

    const kw = v.puissanceKw!;
    const bb = WAL_BB.find((b) => kw <= b.kwMax)!.bb;
    detail.push(`Montant de base (${kw} kW) : ${bb} €`);

    const pct = v.ageAnnees >= 15 ? null : (WAL_DEGRESSIVITE[v.ageAnnees] ?? 1.0);
    if (pct === null) {
      detail.push("15 ans ou plus : montant minimum appliqué");
      return { montant: WAL_MIN_OCCASION, detail, donneesManquantes: [], approximatif: false, source };
    }
    const bbAjuste = bb * pct;
    if (v.ageAnnees > 0) detail.push(`Dégressivité : ${v.ageAnnees} an(s) → ${Math.round(pct * 100)} % → ${arrondi(bbAjuste)} €`);

    const x = v.cycleCO2 === "NEDC" ? 115 : 136;
    const co2 = estElectrique ? 0 : v.co2!;
    const ratioCO2 = co2 / x;
    const ratioMasse = v.mma! / WAL_MASSE_REFERENCE;
    const c = walCoefficientEnergie(v.carburant, kw);

    detail.push(`Rapport CO₂ : ${co2} / ${x} = ${ratioCO2.toFixed(3)}`);
    detail.push(`Rapport masse : ${v.mma} / ${WAL_MASSE_REFERENCE} = ${ratioMasse.toFixed(3)}`);
    detail.push(`Coefficient énergie : ${c}`);

    let montant = bbAjuste * ratioCO2 * ratioMasse * c;
    if (v.reductionFamille) { montant -= 250; detail.push("Réduction famille : −250 €"); }

    montant = Math.min(WAL_MAX, Math.max(v.ageAnnees > 0 ? WAL_MIN_OCCASION : WAL_MIN, arrondi(montant)));
    return { montant, detail, donneesManquantes: [], approximatif: false, source };
  }

  const source = "Vlaamse Belastingdienst — formule BIV, coefficient technologique 2026";

  if (estElectrique) {
    detail.push("Électrique ou hydrogène : forfait minimum flamand (non indexé)");
    return { montant: VLA_MINIMUM_EV, detail, donneesManquantes: [], approximatif: false, source };
  }

  if (!v.co2) manquantes.push("émissions CO₂ WLTP (g/km)");
  const euro = normaliserEuro(v.euroNorm);
  if (!euro) manquantes.push("norme Euro");
  if (manquantes.length > 0) {
    return { montant: null, detail, donneesManquantes: manquantes, approximatif: false, source };
  }

  const f = vlaFacteurCarburant(v.carburant);
  const familleC = v.carburant === "diesel" ? "diesel" : "autre";
  let approximatif = false;
  let cleC: "euro4" | "euro5" | "euro6" = "euro6";
  if (euro === "inferieur") {
    cleC = "euro4";
    approximatif = true;
    manquantes.push("composante air non publiée pour Euro 0 à 3 — valeur Euro 4 appliquée par prudence");
  } else {
    cleC = euro!;
  }
  const c = arrondi(VLA_C_BASE[familleC][cleC] * VLA_INDEXATION_2026);
  const lc = v.ageAnnees >= 15 ? 0 : (VLA_LC[v.ageAnnees] ?? 1.0);

  detail.push(`Facteur carburant f : ${f}`);
  detail.push(`Coefficient technologique q : ${VLA_Q}`);
  detail.push(`Composante air c : ${c} € (${familleC === "diesel" ? "diesel" : "essence et autres"}, ${cleC.replace("euro", "Euro ")})`);
  detail.push(`Correction d'âge LC : ${lc}`);

  const coeur = Math.pow((v.co2! * f * VLA_Q) / 246, 6) * 4500;
  const montant = arrondi((coeur + c) * lc);
  detail.push(`BIV = ( ((${v.co2} × ${f} × ${VLA_Q}) / 246)⁶ × 4500 + ${c} ) × ${lc}`);

  return { montant: Math.max(0, montant), detail, donneesManquantes: manquantes, approximatif, source };
}

export const TC_MINIMUM = 107.18;
export const TC_20CV = 2741.77;
export const TC_PAR_CV_AU_DELA_DE_20 = 149.56;

export const SIMULATEURS_OFFICIELS: Record<Region, string> = {
  wallonie: "https://finances.wallonie.be/home/fiscalite/taxe-de-mise-en-circulation.html",
  bruxelles: "https://mytax.brussels",
  flandre: "https://belastingen.fenb.be/ui/public/simulaties/vkb",
};

export function calculerTaxeCirculation(v: VehiculeFiscal): ResultatTaxe {
  const detail: string[] = [];
  const estElectrique = v.carburant === "electrique" || v.carburant === "hydrogene";

  if (v.region === "flandre") {
    return { montant: null, detail, donneesManquantes: ["barème flamand fondé sur CO₂ et norme Euro — non implémenté"], approximatif: false, source: "Vlaamse Belastingdienst" };
  }

  const source = "Barème commun Bruxelles / Wallonie — 01/07/2026 au 30/06/2027";

  if (estElectrique) {
    detail.push("Électrique : forfait minimum, équivalent 4 CV");
    return { montant: TC_MINIMUM, detail, donneesManquantes: [], approximatif: false, source };
  }

  if (!v.puissanceCv) {
    return { montant: null, detail, donneesManquantes: ["puissance fiscale en CV"], approximatif: false, source };
  }

  if (v.puissanceCv <= 4) {
    detail.push("4 CV ou moins : montant plancher");
    return { montant: TC_MINIMUM, detail, donneesManquantes: [], approximatif: false, source };
  }

  if (v.puissanceCv === 20) {
    return { montant: TC_20CV, detail, donneesManquantes: [], approximatif: false, source };
  }

  if (v.puissanceCv > 20) {
    const montant = arrondi(TC_20CV + (v.puissanceCv - 20) * TC_PAR_CV_AU_DELA_DE_20);
    detail.push(`${TC_20CV} € à 20 CV, puis ${TC_PAR_CV_AU_DELA_DE_20} € par CV supplémentaire`);
    return { montant, detail, donneesManquantes: [], approximatif: false, source };
  }

  return {
    montant: null,
    detail: [`Entre ${TC_MINIMUM} € (4 CV) et ${TC_20CV} € (20 CV)`],
    donneesManquantes: ["barème intermédiaire officiel de 5 à 19 CV non encore intégré"],
    approximatif: false,
    source,
  };
}

export function baremePerime(aujourdhui: Date = new Date()): boolean {
  return aujourdhui > new Date(BAREME_VALIDE_JUSQUAU);
}
