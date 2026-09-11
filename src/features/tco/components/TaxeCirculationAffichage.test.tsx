// Vérifie qu'une taxe de circulation non calculée n'est jamais affichée « 0 € ».
// Si le barème 5–19 CV est un jour intégré à belgianTax.ts, les cas « 7 CV »
// deviennent calculés : adapter ces tests (la Flandre reste non calculée tant
// que son barème n'est pas implémenté).
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import TcoResults from "./results/TcoResults";
import VehicleTcoSection from "./VehicleTcoSection";
import { DEFAULT_FORM, calculateAlternatives, calculateBreakdown } from "../hooks/useTcoCalculator";
import type { TcoFormData } from "../types/tco.types";

/** Rendu statique de la page de résultats du calculateur TCO. */
function rendreResultats(formData: TcoFormData) {
  const breakdown = calculateBreakdown(formData);
  const alternatives = calculateAlternatives(formData, breakdown);
  const conteneur = document.createElement("div");
  conteneur.innerHTML = renderToStaticMarkup(
    <MemoryRouter>
      <TcoResults formData={formData} breakdown={breakdown} alternatives={alternatives} onReset={() => {}} onBack={() => {}} />
    </MemoryRouter>,
  );
  return { conteneur, breakdown };
}

/** Carte « Taxe circulation » de la grille des postes. */
function carteTaxe(conteneur: HTMLElement): HTMLElement {
  const titre = Array.from(conteneur.querySelectorAll("p")).find((p) => p.textContent === "Taxe circulation");
  const carte = titre?.closest<HTMLElement>(".rounded-2xl");
  if (!carte) throw new Error("carte « Taxe circulation » introuvable");
  return carte;
}

describe("Calculateur TCO — affichage de la taxe de circulation", () => {
  it("7 CV (défaut) : « Non calculée » avec le motif, aucun montant en euros", () => {
    const { conteneur } = rendreResultats(DEFAULT_FORM);
    const carte = carteTaxe(conteneur);
    expect(carte.textContent).toContain("Non calculée");
    expect(carte.textContent).toContain("5 à 19 CV non encore intégré");
    expect(carte.textContent).not.toMatch(/€/);
    const texte = conteneur.textContent ?? "";
    expect(texte).toContain("Coût total sur 5 ans, hors taxe de circulation");
    expect(texte).toContain(
      "Taxe de circulation non calculée (barème intermédiaire officiel de 5 à 19 CV non encore intégré)",
    );
  });

  it("4 CV : montant affiché, aucune mention « hors taxe »", () => {
    const { conteneur, breakdown } = rendreResultats({ ...DEFAULT_FORM, fiscalPower: 4 });
    expect(carteTaxe(conteneur).textContent).toContain(`${breakdown.taxe!.toLocaleString("fr-BE")} €`);
    expect(conteneur.textContent).not.toContain("hors taxe de circulation");
  });
});

describe("Fiche véhicule — TCO sur 5 ans", () => {
  let racine: Root | null = null;
  let conteneur: HTMLDivElement | null = null;

  beforeAll(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });

  afterEach(() => {
    act(() => racine?.unmount());
    conteneur?.remove();
    racine = null;
    conteneur = null;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  async function rendreFicheDepliee(puissanceCv: number): Promise<HTMLDivElement> {
    const c = document.createElement("div");
    document.body.appendChild(c);
    conteneur = c;
    const r = createRoot(c);
    racine = r;
    await act(async () => {
      r.render(<VehicleTcoSection price={20000} fuelType="Essence" year={2020} mileage={60000} power={110} puissanceCv={puissanceCv} />);
    });
    // Le premier bouton est l'en-tête repliable de la section.
    await act(async () => {
      c.querySelector("button")?.click();
    });
    return c;
  }

  function ligneTaxe(c: HTMLElement): HTMLElement {
    const libelle = Array.from(c.querySelectorAll("span")).find((s) => s.textContent === "Taxe circulation (5 ans)");
    if (!libelle?.parentElement) throw new Error("ligne « Taxe circulation (5 ans) » introuvable");
    return libelle.parentElement;
  }

  it("7 CV : ligne « non calculée » au lieu de 0 €, total marqué hors taxe", async () => {
    const c = await rendreFicheDepliee(7);
    const ligne = ligneTaxe(c);
    expect(ligne.textContent).toContain("non calculée");
    expect(ligne.textContent).not.toMatch(/€/);
    expect(c.textContent).toContain("hors taxe de circulation (non calculée)");
  });

  it("4 CV : ligne chiffrée, aucune mention « hors taxe »", async () => {
    const c = await rendreFicheDepliee(4);
    expect(ligneTaxe(c).textContent).toMatch(/€/);
    expect(c.textContent).not.toContain("hors taxe de circulation");
  });
});
