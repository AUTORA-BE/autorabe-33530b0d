/**
 * Centralized LEZ (Low Emission Zone) data and logic for Belgian cities
 * Calendrier LEZ complet: Bruxelles, Anvers, Gand
 * @module lib/lezData
 */

// ─── Types ───────────────────────────────────────────────────────────

export type LezStatutType = 'autorise' | 'interdit' | 'derogation_requise' | 'alerte' | 'inconnu';

interface LezRegle {
  statut: 'autorise' | 'interdit' | 'derogation_requise';
  /** Année d'interdiction prévue (null = pas de limite connue) */
  jusque?: number | null;
}

type EuroNormKey = 'euro0' | 'euro1' | 'euro2' | 'euro3' | 'euro4' | 'euro5' | 'euro6' | 'euro6d_temp' | 'euro6d';

type FuelCalendar = Partial<Record<EuroNormKey, LezRegle>>;

interface VilleCalendar {
  diesel: FuelCalendar;
  essence: FuelCalendar;
  electric: LezRegle;
  hybride: LezRegle;
}

export interface LezDetailVille {
  ville: string;
  statut: LezStatutType;
  message: string;
  messageDetail: string;
  couleur: 'green' | 'orange' | 'red' | 'gray';
  anneesRestantes?: number;
  anneeInterdiction?: number;
}

export interface LezResultat {
  global: LezDetailVille;
  details: LezDetailVille[];
}

// ─── Calendrier LEZ ──────────────────────────────────────────────────

const calendarLEZ: Record<string, VilleCalendar> = {
  bruxelles: {
    diesel: {
      euro0: { statut: 'interdit' },
      euro1: { statut: 'interdit' },
      euro2: { statut: 'interdit' },
      euro3: { statut: 'interdit' },
      euro4: { statut: 'interdit' },
      euro5: { statut: 'interdit' },
      euro6: { statut: 'autorise', jusque: 2031 },
      euro6d_temp: { statut: 'autorise', jusque: null },
      euro6d: { statut: 'autorise', jusque: null },
    },
    essence: {
      euro0: { statut: 'interdit' },
      euro1: { statut: 'interdit' },
      euro2: { statut: 'interdit' },
      euro3: { statut: 'autorise', jusque: null },
      euro4: { statut: 'autorise', jusque: null },
      euro5: { statut: 'autorise', jusque: null },
      euro6: { statut: 'autorise', jusque: null },
      euro6d_temp: { statut: 'autorise', jusque: null },
      euro6d: { statut: 'autorise', jusque: null },
    },
    electric: { statut: 'autorise', jusque: null },
    hybride: { statut: 'autorise', jusque: null },
  },
  anvers: {
    diesel: {
      euro0: { statut: 'derogation_requise' },
      euro1: { statut: 'derogation_requise' },
      euro2: { statut: 'derogation_requise' },
      euro3: { statut: 'derogation_requise' },
      euro4: { statut: 'autorise', jusque: null },
      euro5: { statut: 'autorise', jusque: null },
      euro6: { statut: 'autorise', jusque: null },
      euro6d_temp: { statut: 'autorise', jusque: null },
      euro6d: { statut: 'autorise', jusque: null },
    },
    essence: {
      euro0: { statut: 'autorise', jusque: null },
      euro1: { statut: 'autorise', jusque: null },
      euro2: { statut: 'autorise', jusque: null },
      euro3: { statut: 'autorise', jusque: null },
      euro4: { statut: 'autorise', jusque: null },
      euro5: { statut: 'autorise', jusque: null },
      euro6: { statut: 'autorise', jusque: null },
      euro6d_temp: { statut: 'autorise', jusque: null },
      euro6d: { statut: 'autorise', jusque: null },
    },
    electric: { statut: 'autorise', jusque: null },
    hybride: { statut: 'autorise', jusque: null },
  },
  gand: {
    diesel: {
      euro0: { statut: 'derogation_requise' },
      euro1: { statut: 'derogation_requise' },
      euro2: { statut: 'derogation_requise' },
      euro3: { statut: 'derogation_requise' },
      euro4: { statut: 'autorise', jusque: null },
      euro5: { statut: 'autorise', jusque: null },
      euro6: { statut: 'autorise', jusque: null },
      euro6d_temp: { statut: 'autorise', jusque: null },
      euro6d: { statut: 'autorise', jusque: null },
    },
    essence: {
      euro0: { statut: 'autorise', jusque: null },
      euro1: { statut: 'autorise', jusque: null },
      euro2: { statut: 'autorise', jusque: null },
      euro3: { statut: 'autorise', jusque: null },
      euro4: { statut: 'autorise', jusque: null },
      euro5: { statut: 'autorise', jusque: null },
      euro6: { statut: 'autorise', jusque: null },
      euro6d_temp: { statut: 'autorise', jusque: null },
      euro6d: { statut: 'autorise', jusque: null },
    },
    electric: { statut: 'autorise', jusque: null },
    hybride: { statut: 'autorise', jusque: null },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

const ANNEE_ACTUELLE = new Date().getFullYear();
const SEUIL_ALERTE = 5;

/**
 * Normalise la norme Euro en clé interne
 * Ex: "Euro 6d" -> "euro6d", "Euro 6b" -> "euro6", "Euro 6d-TEMP" -> "euro6d_temp"
 */
function normaliserNormeEuro(euroNorm: string): EuroNormKey | null {
  const norm = euroNorm.toLowerCase().trim().replace(/\s+/g, '');

  if (norm.includes('6d-temp') || norm.includes('6d_temp') || norm.includes('6dtemp')) return 'euro6d_temp';
  if (norm.includes('6d')) return 'euro6d';
  if (norm.includes('6c') || norm.includes('6b')) return 'euro6';
  if (norm.includes('6')) return 'euro6';
  if (norm.includes('5')) return 'euro5';
  if (norm.includes('4')) return 'euro4';
  if (norm.includes('3')) return 'euro3';
  if (norm.includes('2')) return 'euro2';
  if (norm.includes('1')) return 'euro1';
  if (norm.includes('0')) return 'euro0';

  return null;
}

/**
 * Normalise le type de carburant en clé interne
 */
function normaliserCarburant(fuelType: string): 'diesel' | 'essence' | 'electric' | 'hybride' | null {
  const fuel = fuelType.toLowerCase().trim();

  if (fuel.includes('diesel')) return 'diesel';
  if (fuel.includes('essence') || fuel.includes('benzine')) return 'essence';
  if (fuel.includes('lectrique') || fuel.includes('electric')) return 'electric';
  if (fuel.includes('hybride') || fuel.includes('hybrid')) return 'hybride';

  return null;
}

/**
 * Évalue le statut LEZ d'un véhicule pour une ville donnée
 */
function evaluerVille(villeNom: string, villeData: VilleCalendar, carburant: string, normKey: EuroNormKey | null): LezDetailVille {
  const fuelKey = normaliserCarburant(carburant);

  // Électrique ou hybride → accès direct
  if (fuelKey === 'electric' || fuelKey === 'hybride') {
    const regle = villeData[fuelKey];
    return {
      ville: villeNom,
      statut: 'autorise',
      message: 'Autorisé',
      messageDetail: regle.jusque ? `Autorisé jusqu'en ${regle.jusque}` : 'Aucune restriction prévue',
      couleur: 'green',
    };
  }

  // Carburant ou norme inconnu
  if (!fuelKey || !normKey || (fuelKey !== 'diesel' && fuelKey !== 'essence')) {
    return {
      ville: villeNom,
      statut: 'inconnu',
      message: 'Vérification requise',
      messageDetail: 'Norme ou carburant non spécifié',
      couleur: 'gray',
    };
  }

  const regle = villeData[fuelKey]?.[normKey];

  if (!regle) {
    return {
      ville: villeNom,
      statut: 'inconnu',
      message: 'Vérification requise',
      messageDetail: 'Norme inconnue',
      couleur: 'gray',
    };
  }

  // INTERDIT
  if (regle.statut === 'interdit') {
    return {
      ville: villeNom,
      statut: 'interdit',
      message: 'Interdit',
      messageDetail: 'Circulation interdite',
      couleur: 'red',
    };
  }

  // DÉROGATION REQUISE
  if (regle.statut === 'derogation_requise') {
    return {
      ville: villeNom,
      statut: 'derogation_requise',
      message: 'Dérogation requise',
      messageDetail: 'Max 8 jours/an avec dérogation payante',
      couleur: 'orange',
    };
  }

  // AUTORISÉ
  if (!regle.jusque) {
    return {
      ville: villeNom,
      statut: 'autorise',
      message: 'Autorisé',
      messageDetail: 'Aucune restriction prévue',
      couleur: 'green',
    };
  }

  const anneesRestantes = regle.jusque - ANNEE_ACTUELLE;

  // Déjà dépassé → interdit
  if (anneesRestantes <= 0) {
    return {
      ville: villeNom,
      statut: 'interdit',
      message: 'Interdit',
      messageDetail: 'Circulation interdite',
      couleur: 'red',
    };
  }

  // Alerte < 5 ans
  if (anneesRestantes <= SEUIL_ALERTE) {
    return {
      ville: villeNom,
      statut: 'alerte',
      message: `Interdit dès ${regle.jusque}`,
      messageDetail: `Plus que ${anneesRestantes} an${anneesRestantes > 1 ? 's' : ''}`,
      couleur: 'orange',
      anneesRestantes,
      anneeInterdiction: regle.jusque,
    };
  }

  // > 5 ans → OK
  return {
    ville: villeNom,
    statut: 'autorise',
    message: `Autorisé jusqu'en ${regle.jusque}`,
    messageDetail: 'Situation stable',
    couleur: 'green',
  };
}

// ─── API publique ────────────────────────────────────────────────────

/**
 * Calcule le statut LEZ complet d'un véhicule pour les 3 villes belges
 * Le statut global est le plus restrictif des 3 villes
 */
export function calculerStatutLEZ(fuelType: string, euroNorm: string): LezResultat {
  const normKey = normaliserNormeEuro(euroNorm);
  const villes = ['bruxelles', 'anvers', 'gand'] as const;

  const details: LezDetailVille[] = villes.map((ville) =>
    evaluerVille(ville, calendarLEZ[ville], fuelType, normKey)
  );

  const priorite: Record<LezStatutType, number> = {
    interdit: 4,
    alerte: 3,
    derogation_requise: 2,
    autorise: 1,
    inconnu: 0,
  };

  const global = details.reduce((pire, current) =>
    priorite[current.statut] > priorite[pire.statut] ? current : pire
  );

  return { global, details };
}
