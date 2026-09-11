import { describe, it, expect, vi, afterAll } from "vitest";

// computeMatchScore dépend du calendrier LEZ, dont les échéances sont comparées
// à l'année courante lue au CHARGEMENT du module lezData : on fige la date AVANT
// l'import, sinon les scores changeraient au 1er janvier (cf. lezData.test.ts).
vi.hoisted(() => {
  vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));
});

import type { Vehicle } from "@/features/listings/types/vehicle.types";
import type { BuyerProfile } from "../hooks/useBuyerProfile";
import { computeMatchScore } from "./matchScore";

afterAll(() => {
  vi.useRealTimers();
});

const vehicule = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: "test-vehicle",
  brand: "Volkswagen",
  model: "Golf",
  year: 2019,
  price: 15000,
  mileage: 100000,
  fuelType: "Diesel",
  transmission: "manuelle",
  euroNorm: "Euro 6",
  location: "Namur",
  image: "",
  isLezCompatible: true,
  hasCarPass: true,
  sellerType: "particulier",
  ...overrides,
});

const profil = (overrides: Partial<BuyerProfile> = {}): BuyerProfile => ({
  region: "bruxelles",
  kmPerYear: 15000,
  maxBudget: 25000,
  isConfigured: true,
  ...overrides,
});

// Les valeurs attendues ci-dessous sont calculées à la main à partir des
// constantes de features/tco/constants/belgianData.ts (TAXE_REGION,
// PRIX_CARBURANT, DEFAULT_CONSUMPTION, ENTRETIEN_BASE). Un changement de
// constante OU de barème fera échouer ces tests : c'est voulu, ils figent le
// comportement du score « Pour Toi » affiché sur les cartes.
describe("computeMatchScore — profils de référence", () => {
  it("diesel Euro 6 sous le budget, à Bruxelles : alerte LEZ 2030 → 85/100", () => {
    // budget 15 000/25 000 = 0,60 → 40 pts
    // taxe 234 + carburant 150 × 5,8 L × 1,72 € = 1 496,40 + entretien 980 = 2 710,40 €/an
    // coût/budget = 0,108 → 30 pts ; LEZ : Bruxelles interdit le diesel en 2030 → alerte → 15 pts
    expect(computeMatchScore(vehicule(), profil())).toEqual({
      score: 85,
      label: "Parfait pour toi",
      color: "primary",
      monthlyCost: 226,
      breakdown: { budgetScore: 40, costScore: 30, lezScore: 15 },
    });
  });

  it("électrique en Flandre : taxe 0, 0,35 €/kWh, aucune restriction LEZ → 98/100", () => {
    // 150 × 17 kWh × 0,35 € = 892,50 + entretien 350 = 1 242,50 €/an (taxe Flandre électrique = 0)
    const resultat = computeMatchScore(
      vehicule({ fuelType: "Électrique", euroNorm: "", price: 25000 }),
      profil({ region: "flandre", maxBudget: 30000 }),
    );
    expect(resultat).toEqual({
      score: 98,
      label: "Parfait pour toi",
      color: "primary",
      monthlyCost: 104,
      breakdown: { budgetScore: 38, costScore: 35, lezScore: 25 },
    });
  });

  it("diesel Euro 5 : interdit à Bruxelles → 0 pt LEZ, le score tombe à 50 (« Bon match »)", () => {
    // Rappel P2b : le diesel Euro 5 est admis à Anvers et Gand, interdit à Bruxelles ;
    // le verdict global (le plus restrictif) est donc « interdit ».
    expect(
      computeMatchScore(
        vehicule({ euroNorm: "Euro 5", price: 8000 }),
        profil({ region: "wallonie", kmPerYear: 20000, maxBudget: 12000 }),
      ),
    ).toEqual({
      score: 50,
      label: "Bon match",
      color: "amber",
      monthlyCost: 267,
      breakdown: { budgetScore: 40, costScore: 10, lezScore: 0 },
    });
  });

  it("essence Euro 2 très au-dessus du budget → « À évaluer »", () => {
    expect(
      computeMatchScore(
        vehicule({ fuelType: "Essence", euroNorm: "Euro 2", price: 20000 }),
        profil({ kmPerYear: 25000, maxBudget: 10000 }),
      ),
    ).toEqual({
      score: 15,
      label: "À évaluer",
      color: "muted",
      monthlyCost: 315,
      breakdown: { budgetScore: 5, costScore: 10, lezScore: 0 },
    });
  });

  it("hybride rechargeable : 2,5 L/100 km au tarif de repli 1,65 €/L → score maximal", () => {
    expect(
      computeMatchScore(
        vehicule({ fuelType: "Hybride rechargeable", euroNorm: "Euro 6d", price: 20000 }),
        profil({ maxBudget: 30000 }),
      ),
    ).toEqual({
      score: 100,
      label: "Parfait pour toi",
      color: "primary",
      monthlyCost: 129,
      breakdown: { budgetScore: 40, costScore: 35, lezScore: 25 },
    });
  });
});

describe("barème budget (40 pts) — paliers du rapport prix / budget", () => {
  // Véhicule électrique : le coût annuel ne dépend pas du prix, seul budgetScore varie.
  const scoreBudget = (price: number) =>
    computeMatchScore(
      vehicule({ fuelType: "Électrique", euroNorm: "", price }),
      profil({ region: "flandre", maxBudget: 20000 }),
    ).breakdown.budgetScore;

  const paliers: [number, number, number][] = [
    [14000, 0.7, 40],
    [18000, 0.9, 38],
    [20000, 1.0, 35],
    [22000, 1.1, 25],
    [26000, 1.3, 15],
    [26200, 1.31, 5],
  ];

  for (const [price, ratio, attendu] of paliers) {
    it(`prix ${price} € = ${ratio} × budget → ${attendu} pts`, () => {
      expect(scoreBudget(price)).toBe(attendu);
    });
  }
});

describe("barème coût annuel (35 pts) — paliers du rapport coût / budget", () => {
  // Électrique en Flandre : coût annuel fixe de 1 242,50 € ; seul le budget bouge.
  const scoreCout = (maxBudget: number) =>
    computeMatchScore(
      vehicule({ fuelType: "Électrique", euroNorm: "", price: 1 }),
      profil({ region: "flandre", maxBudget }),
    ).breakdown.costScore;

  const paliers: [number, number][] = [
    [20000, 35],
    [12000, 30],
    [8000, 25],
    [6000, 18],
    [4000, 10],
  ];

  for (const [maxBudget, attendu] of paliers) {
    it(`budget ${maxBudget} € → ${attendu} pts`, () => {
      expect(scoreCout(maxBudget)).toBe(attendu);
    });
  }
});

describe("barème LEZ (25 pts) — un statut, un score", () => {
  const scoreLez = (fuelType: string, euroNorm: string) =>
    computeMatchScore(vehicule({ fuelType, euroNorm }), profil()).breakdown.lezScore;

  it("autorisé partout (essence Euro 6) → 25 pts", () => {
    expect(scoreLez("Essence", "Euro 6")).toBe(25);
  });

  it("alerte (diesel Euro 6, fin du diesel à Bruxelles en 2030) → 15 pts", () => {
    expect(scoreLez("Diesel", "Euro 6")).toBe(15);
  });

  it("interdit (diesel Euro 5, Bruxelles) → 0 pt", () => {
    expect(scoreLez("Diesel", "Euro 5")).toBe(0);
  });

  it("norme absente → statut inconnu, 12 pts par défaut (ni pénalisé ni récompensé)", () => {
    expect(scoreLez("Diesel", "")).toBe(12);
  });
});

describe("correspondance carburant → tarifs (comportement figé, pas validé)", () => {
  const cout = (fuelType: string) =>
    computeMatchScore(
      vehicule({ fuelType, euroNorm: "Euro 6d", price: 10000 }),
      profil({ region: "wallonie" }),
    ).monthlyCost;

  it("un carburant non reconnu retombe sur l'essence 95", () => {
    expect(cout("Carburant exotique")).toBe(cout("Essence"));
  });

  // ⚠️ Constat à traiter hors de ce lot : belgianData.ts connaît un prix GPL
  // (0,769 €/L) mais computeMatchScore ne mappe pas le GPL et le facture au
  // tarif essence 95 (1,75 €/L). Ce test fige l'état actuel, il ne l'approuve pas.
  it("le GPL est facturé au tarif essence 95, pas au prix GPL de belgianData", () => {
    expect(cout("GPL")).toBe(cout("Essence"));
    expect(cout("GPL")).toBe(227);
  });

  it("« Hybride » et « Hybride rechargeable » ont des tarifs distincts", () => {
    expect(cout("Hybride")).not.toBe(cout("Hybride rechargeable"));
  });
});
