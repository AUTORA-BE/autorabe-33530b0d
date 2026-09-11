// Taxe de circulation dans le TCO : un montant non calculé par le moteur fiscal
// est exclu du total et signalé, jamais compté 0 €. Si le barème 5–19 CV est un
// jour intégré à belgianTax.ts, les cas « 5 à 19 CV » deviennent calculés :
// adapter ces tests.
import { describe, it, expect } from "vitest";
import { DEFAULT_FORM, calculateBreakdown, calculateAlternatives } from "./useTcoCalculator";
import { TC_20CV, TC_MINIMUM } from "@/lib/belgianTax";
import type { TcoFormData } from "../types/tco.types";

const form = (patch: Partial<TcoFormData> = {}): TcoFormData => ({ ...DEFAULT_FORM, ...patch });

describe("TCO — taxe de circulation non calculée : jamais comptée 0 €", () => {
  it("formulaire par défaut (7 CV) : taxe non calculée, motif du moteur fiscal", () => {
    expect(DEFAULT_FORM.fiscalPower).toBe(7);
    const b = calculateBreakdown(DEFAULT_FORM);
    expect(b.taxe).toBeNull();
    expect(b.details.taxeAnnuelle).toBeNull();
    expect(b.motifTaxeNonCalculee).toContain("5 à 19 CV");
  });

  it("le total est hors taxe de circulation et cohérent avec les postes affichés", () => {
    const b = calculateBreakdown(DEFAULT_FORM);
    expect(b.total).toBe(b.totalHorsTaxe);
    // postes arrondis individuellement : écart d'arrondi toléré
    const somme = b.carburant + b.entretien + b.assurance + b.depreciation - b.prime;
    expect(Math.abs(b.total - somme)).toBeLessThanOrEqual(2);
  });

  it.each([5, 12, 19])("%i CV : taxe non calculée", (cv) => {
    const b = calculateBreakdown(form({ fiscalPower: cv }));
    expect(b.taxe).toBeNull();
    expect(b.total).toBe(b.totalHorsTaxe);
  });

  it("Flandre : taxe non calculée, avec le motif propre à la Flandre", () => {
    const b = calculateBreakdown(form({ region: "flandre" }));
    expect(b.taxe).toBeNull();
    expect(b.motifTaxeNonCalculee).toContain("flamand");
    expect(b.total).toBe(b.totalHorsTaxe);
  });
});

describe("TCO — taxe de circulation calculée : comportement inchangé", () => {
  const cas: Array<[string, Partial<TcoFormData>, number]> = [
    ["4 CV", { fiscalPower: 4 }, TC_MINIMUM],
    ["20 CV", { fiscalPower: 20 }, TC_20CV],
    ["électrique", { fuelType: "electric", consumption: 17 }, TC_MINIMUM],
  ];

  it.each(cas)("%s : taxe incluse dans le total", (_, patch, annuel) => {
    const b = calculateBreakdown(form(patch));
    expect(b.taxe).toBe(Math.round(annuel * 5));
    expect(b.details.taxeAnnuelle).toBe(Math.round(annuel));
    expect(b.motifTaxeNonCalculee).toBeNull();
    expect(Math.abs(b.total - (b.totalHorsTaxe + (b.taxe as number)))).toBeLessThanOrEqual(1);
  });
});

describe("TCO — alternatives comparées à base égale", () => {
  it("7 CV vs électrique : économie calculée hors taxe des deux côtés", () => {
    const b = calculateBreakdown(DEFAULT_FORM);
    const ev = calculateAlternatives(DEFAULT_FORM, b).find((a) => a.fuelType === "electric");
    expect(ev).toBeDefined();
    expect(ev!.breakdown.taxe).toBe(Math.round(TC_MINIMUM * 5));
    expect(ev!.economieHorsTaxe).toBe(true);
    expect(ev!.economie).toBe(b.totalHorsTaxe - ev!.breakdown.totalHorsTaxe);
  });

  it("4 CV : taxes calculées des deux côtés, économie sur les totaux complets", () => {
    const f = form({ fiscalPower: 4 });
    const b = calculateBreakdown(f);
    const alts = calculateAlternatives(f, b);
    expect(alts.length).toBeGreaterThan(0);
    for (const alt of alts) {
      expect(alt.economieHorsTaxe).toBe(false);
      expect(alt.economie).toBe(b.total - alt.breakdown.total);
    }
  });
});
