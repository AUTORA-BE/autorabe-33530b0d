// Fiche véhicule : le « coût total sur 5 ans » = perte de valeur + utilisation,
// comme le calculateur TCO. Le prix d'achat n'est pas additionné en plus de la
// dépréciation (il l'était, ce qui comptait deux fois la perte de valeur).
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import VehicleTcoSection from "./VehicleTcoSection";

const POSTES = ["Carburant (5 ans)", "Entretien (5 ans)", "Assurance (5 ans)", "Taxe circulation (5 ans)", "Dépréciation estimée"];

/** « 20 000 € » → 20000 ; null si le poste n'est pas chiffré (« non calculée »). */
const montant = (texte: string | null | undefined): number | null => {
  if (!texte || !/€/.test(texte)) return null;
  return Number(texte.replace(/[^\d]/g, ""));
};

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

/** Valeur affichée à côté d'un libellé de la répartition. */
function valeurPoste(c: HTMLElement, libelle: string): number | null {
  const span = Array.from(c.querySelectorAll("span")).find((s) => s.textContent === libelle);
  if (!span) throw new Error(`poste « ${libelle} » introuvable`);
  return montant(span.nextElementSibling?.textContent);
}

/** Montant de la carte « Coût total sur 5 ans » (corps de la section). */
function totalAffiche(c: HTMLElement): number {
  const titre = Array.from(c.querySelectorAll("p")).find((p) => p.textContent === "Coût total sur 5 ans");
  const total = montant(titre?.nextElementSibling?.textContent);
  if (total === null) throw new Error("total introuvable");
  return total;
}

describe("Fiche véhicule — coût total sur 5 ans", () => {
  it("n'additionne plus le prix d'achat : total = somme des postes affichés", async () => {
    const c = await rendreFicheDepliee(4);
    const postes = POSTES.map((p) => valeurPoste(c, p));
    expect(postes.every((v) => v !== null)).toBe(true);
    const somme = postes.reduce<number>((s, v) => s + (v as number), 0);
    // postes arrondis individuellement : écart d'arrondi toléré
    expect(Math.abs(totalAffiche(c) - somme)).toBeLessThanOrEqual(3);
    expect(Array.from(c.querySelectorAll("span")).some((s) => s.textContent === "Prix d'achat")).toBe(false);
    expect(c.textContent).toContain("n'est pas additionné");
  });

  it("7 CV : total = somme des postes chiffrés, taxe non calculée exclue", async () => {
    const c = await rendreFicheDepliee(7);
    expect(valeurPoste(c, "Taxe circulation (5 ans)")).toBeNull();
    const somme = POSTES.map((p) => valeurPoste(c, p) ?? 0).reduce((s, v) => s + v, 0);
    expect(Math.abs(totalAffiche(c) - somme)).toBeLessThanOrEqual(3);
  });
});
