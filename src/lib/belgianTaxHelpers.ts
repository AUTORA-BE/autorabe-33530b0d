/**
 * Helpers de branchement du moteur fiscal belge sur les données de l'app.
 * Le moteur (`belgianTax.ts`) reste une source pure et vérifiée : rien ici
 * ne modifie un barème, on ne fait que traduire les libellés de l'app.
 */

import type { Carburant, CycleCO2, Region } from "./belgianTax";

/** Libellé de carburant de l'app (FR libre) → type fiscal. */
export function mapCarburant(fuelType?: string | null): Carburant {
  const f = (fuelType ?? "").toLowerCase();
  if (f.includes("hydrog")) return "hydrogene";
  if (f.includes("lectri") || f.includes("electric") || f === "ev") return "electrique";
  if (f.includes("lpg") || f.includes("gpl")) return "lpg";
  if (f.includes("cng") || f.includes("gnc") || f.includes("gaz naturel")) return "cng";
  if (f.includes("hybri")) return "hybride";
  if (f.includes("diesel")) return "diesel";
  return "essence";
}

export const REGION_LABELS: Record<Region, string> = {
  bruxelles: "Bruxelles-Capitale",
  wallonie: "Wallonie",
  flandre: "Flandre",
};

/** Chevaux (ch) → kilowatts. */
export function chToKw(ch?: number | null): number | null {
  if (!ch || ch <= 0) return null;
  return Math.round(ch * 0.7355);
}

export function normaliserCycle(cycle?: string | null): CycleCO2 {
  return (cycle ?? "").toUpperCase() === "NEDC" ? "NEDC" : "WLTP";
}

/** Âge en années pleines à partir de l'année de mise en circulation. */
export function ageDepuisAnnee(year?: number | null): number {
  if (!year) return 0;
  return Math.max(0, new Date().getFullYear() - year);
}

export const formatEur = (n: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
