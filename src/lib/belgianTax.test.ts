import { describe, it, expect } from "vitest";
import { calculerTMC, calculerTaxeCirculation, type VehiculeFiscal } from "./belgianTax";

const base: VehiculeFiscal = { region: "wallonie", carburant: "essence", ageAnnees: 0, cycleCO2: "WLTP" };

describe("TMC Wallonie — formule depuis le 01/07/2025", () => {
  it("reproduit le cas de reference officiel a moins de 1 % pres", () => {
    const r = calculerTMC({ ...base, puissanceKw: 110, co2: 120, mma: 1900 });
    expect(r.montant).not.toBeNull();
    expect(Math.abs(r.montant! - 823.07) / 823.07).toBeLessThan(0.01);
  });
  it("applique le plancher de 50 EUR a une electrique neuve", () => {
    const r = calculerTMC({ ...base, carburant: "electrique", puissanceKw: 100, co2: 0, mma: 1800 });
    expect(r.montant).toBe(50);
  });
  it("applique le minimum occasion a 15 ans et plus", () => {
    const r = calculerTMC({ ...base, puissanceKw: 110, co2: 120, mma: 1900, ageAnnees: 16 });
    expect(r.montant).toBe(61.5);
  });
  it("ne calcule rien sans CO2 ni MMA et le dit", () => {
    const r = calculerTMC({ ...base, puissanceKw: 110 });
    expect(r.montant).toBeNull();
    expect(r.donneesManquantes.length).toBeGreaterThan(0);
  });
});

describe("TMC Bruxelles — deux grilles, la plus elevee", () => {
  it("retient la grille kW quand elle est plus elevee", () => {
    const r = calculerTMC({ ...base, region: "bruxelles", puissanceKw: 100, puissanceCv: 8 });
    expect(r.montant).toBe(634.89);
  });
  it("applique la degressivite d age", () => {
    const r = calculerTMC({ ...base, region: "bruxelles", puissanceKw: 100, ageAnnees: 3 });
    expect(r.montant).toBeCloseTo(634.89 * 0.7, 1);
  });
  it("ne descend jamais sous le plancher de 78,88 EUR", () => {
    const r = calculerTMC({ ...base, region: "bruxelles", puissanceKw: 60, ageAnnees: 12 });
    expect(r.montant).toBe(78.88);
  });
  it("applique le tarif minimum aux electriques", () => {
    const r = calculerTMC({ ...base, region: "bruxelles", carburant: "electrique", puissanceKw: 150 });
    expect(r.montant).toBe(78.88);
  });
});

describe("BIV Flandre — formule CO2 / Euronorme / age", () => {
  it("applique le forfait de 61,50 EUR aux electriques", () => {
    const r = calculerTMC({ ...base, region: "flandre", carburant: "electrique", co2: 0 });
    expect(r.montant).toBe(61.5);
  });
  it("utilise 28,54 EUR de composante air pour une essence Euro 6", () => {
    const r = calculerTMC({ ...base, region: "flandre", co2: 100, euroNorm: "Euro 6" });
    expect(r.detail.join(" ")).toContain("28.54");
  });
  it("annule la taxe au-dela de 15 ans", () => {
    const r = calculerTMC({ ...base, region: "flandre", co2: 180, euroNorm: "Euro 5", ageAnnees: 16 });
    expect(r.montant).toBe(0);
  });
  it("signale l approximation pour les normes Euro 0 a 3", () => {
    const r = calculerTMC({ ...base, region: "flandre", co2: 180, euroNorm: "Euro 3" });
    expect(r.approximatif).toBe(true);
  });
  it("taxe davantage un diesel qu une essence a CO2 egal", () => {
    const d = calculerTMC({ ...base, region: "flandre", carburant: "diesel", co2: 130, euroNorm: "Euro 6" });
    const e = calculerTMC({ ...base, region: "flandre", carburant: "essence", co2: 130, euroNorm: "Euro 6" });
    expect(d.montant!).toBeGreaterThan(e.montant!);
  });
});

describe("Taxe de circulation", () => {
  it("applique le forfait aux electriques", () => {
    expect(calculerTaxeCirculation({ ...base, carburant: "electrique" }).montant).toBe(107.18);
  });
  it("applique le plancher jusqu a 4 CV", () => {
    expect(calculerTaxeCirculation({ ...base, puissanceCv: 4 }).montant).toBe(107.18);
  });
  it("calcule au-dela de 20 CV", () => {
    const r = calculerTaxeCirculation({ ...base, puissanceCv: 22 });
    expect(r.montant).toBeCloseTo(2741.77 + 2 * 149.56, 2);
  });
  it("refuse d inventer les tranches intermediaires", () => {
    const r = calculerTaxeCirculation({ ...base, puissanceCv: 10 });
    expect(r.montant).toBeNull();
    expect(r.donneesManquantes.length).toBeGreaterThan(0);
  });
});
