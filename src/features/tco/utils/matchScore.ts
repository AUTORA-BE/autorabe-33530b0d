/**
 * Calcule un score de matching (0–100) entre un véhicule et un profil acheteur.
 * Prend en compte : budget, coût annuel (taxes + carburant), compatibilité LEZ.
 *
 * @module features/tco/utils/matchScore
 */

import type { Vehicle } from "@/features/listings/types/vehicle.types";
import type { BuyerProfile } from "../hooks/useBuyerProfile";
import { TAXE_REGION, PRIX_CARBURANT, DEFAULT_CONSUMPTION, ENTRETIEN_BASE } from "../constants/belgianData";
import { calculerStatutLEZ } from "@/lib/lezData";

export interface MatchResult {
  /** Score global 0–100 */
  score: number;
  /** Label affiché */
  label: string;
  /** Couleur sémantique */
  color: "primary" | "amber" | "muted";
  /** Coût mensuel estimé (tout compris hors achat) */
  monthlyCost: number;
  /** Détails du scoring */
  breakdown: {
    budgetScore: number;
    costScore: number;
    lezScore: number;
  };
}

/** Map fuel_type de l'annonce vers les clés TCO */
function mapFuelKey(fuelType: string): string {
  const lower = fuelType.toLowerCase();
  if (lower.includes("diesel")) return "diesel";
  if (lower.includes("électrique") || lower.includes("electric")) return "electric";
  if (lower.includes("hybride rechargeable") || lower.includes("phev")) return "hybridePHEV";
  if (lower.includes("hybride")) return "hybride";
  return "essence95";
}

/**
 * Calcule le score de matching TCO pour un véhicule
 */
export function computeMatchScore(vehicle: Vehicle, profile: BuyerProfile): MatchResult {
  const fuelKey = mapFuelKey(vehicle.fuelType);

  // ── 1. Budget score (40 pts) ──────────────────────────────────────
  let budgetScore: number;
  const ratio = vehicle.price / profile.maxBudget;
  if (ratio <= 0.7) budgetScore = 40; // well under budget
  else if (ratio <= 0.9) budgetScore = 38;
  else if (ratio <= 1.0) budgetScore = 35;
  else if (ratio <= 1.1) budgetScore = 25;
  else if (ratio <= 1.3) budgetScore = 15;
  else budgetScore = 5;

  // ── 2. Running cost score (35 pts) ────────────────────────────────
  const taxeAnnuelle = TAXE_REGION[profile.region]?.[fuelKey] ?? 200;
  const consumption = DEFAULT_CONSUMPTION[fuelKey as keyof typeof DEFAULT_CONSUMPTION] ?? 6.5;
  const prixCarburant = fuelKey === "electric"
    ? 0.35
    : (PRIX_CARBURANT[fuelKey] ?? 1.65);
  const carburantAnnuel = (profile.kmPerYear / 100) * consumption * prixCarburant;
  const entretienAnnuel = ENTRETIEN_BASE[fuelKey] ?? 800;
  const coutAnnuel = taxeAnnuelle + carburantAnnuel + entretienAnnuel;
  const monthlyCost = Math.round(coutAnnuel / 12);

  // Score basé sur le ratio coût/budget (un coût annuel < 15% du budget = top)
  const costRatio = coutAnnuel / profile.maxBudget;
  let costScore: number;
  if (costRatio <= 0.08) costScore = 35;
  else if (costRatio <= 0.12) costScore = 30;
  else if (costRatio <= 0.18) costScore = 25;
  else if (costRatio <= 0.25) costScore = 18;
  else costScore = 10;

  // ── 3. LEZ compatibility (25 pts) ─────────────────────────────────
  const lezResult = calculerStatutLEZ(vehicle.fuelType, vehicle.euroNorm);
  let lezScore: number;
  switch (lezResult.global.statut) {
    case "autorise": lezScore = 25; break;
    case "alerte": lezScore = 15; break;
    case "derogation_requise": lezScore = 10; break;
    case "interdit": lezScore = 0; break;
    default: lezScore = 12;
  }

  const score = Math.min(100, budgetScore + costScore + lezScore);

  let label: string;
  let color: "primary" | "amber" | "muted";
  if (score >= 75) {
    label = "Parfait pour toi";
    color = "primary";
  } else if (score >= 50) {
    label = "Bon match";
    color = "amber";
  } else {
    label = "À évaluer";
    color = "muted";
  }

  return {
    score,
    label,
    color,
    monthlyCost,
    breakdown: { budgetScore, costScore, lezScore },
  };
}
