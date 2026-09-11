import { describe, it, expect, vi, afterAll } from "vitest";

// Les échéances du calendrier sont comparées à l'année courante, lue au
// chargement du module : on fige la date AVANT l'import (tests déterministes).
vi.hoisted(() => {
  vi.setSystemTime(new Date("2026-09-11T12:00:00Z"));
});

import { auditLezFlag, calculerStatutLEZ, isLezCompatible } from "./lezData";

afterAll(() => {
  vi.useRealTimers();
});

const statutParVille = (carburant: string, norme: string) =>
  Object.fromEntries(calculerStatutLEZ(carburant, norme).details.map((d) => [d.ville, d.statut]));

const admis = (statut: string) => statut === "autorise" || statut === "alerte";

describe("isLezCompatible — même verdict que calculerStatutLEZ (source unique)", () => {
  const carburants = ["Diesel", "Essence", "GPL", "Électrique", "Hydrogène", "Hybride", "Hybride rechargeable", "Inconnu", "", null, undefined];
  const normes = ["Euro 0", "Euro 1", "Euro 2", "Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6b", "Euro 6c", "Euro 6d-TEMP", "Euro 6d", "Non spécifié", "", null, undefined];

  it("aucune combinaison carburant × norme ne diverge du statut global", () => {
    const divergences: string[] = [];
    for (const carburant of carburants) {
      for (const norme of normes) {
        const global = calculerStatutLEZ(carburant ?? "", norme ?? "").global.statut;
        const attendu = Boolean(carburant) && admis(global);
        if (isLezCompatible(carburant, norme) !== attendu) {
          divergences.push(`${carburant} / ${norme} (statut global : ${global})`);
        }
      }
    }
    expect(divergences).toEqual([]);
  });
});

describe("diesel Euro 5 (P2b)", () => {
  it("admis à Anvers et à Gand, interdit à Bruxelles", () => {
    expect(statutParVille("Diesel", "Euro 5")).toEqual({ bruxelles: "interdit", anvers: "autorise", gand: "autorise" });
  });

  it("verdict global « interdit » à cause de Bruxelles → non compatible, comme le badge des cartes", () => {
    const { global } = calculerStatutLEZ("Diesel", "Euro 5");
    expect(global.statut).toBe("interdit");
    expect(global.ville).toBe("bruxelles");
    expect(isLezCompatible("diesel", "Euro 5")).toBe(false);
  });
});

// Règles en vigueur vérifiées le 11/09/2026 sur les sources officielles :
// lez.brussels (diesel Euro 6 et essence Euro 3 minimum depuis le 01/01/2026) ;
// stad.gent, tableau des conditions d'accès (diesel Euro 5 et essence Euro 2
// minimum en accès libre, durcissement du 01/01/2026 retiré) ; Anvers applique
// le même cadre flamand.
describe("règles LEZ en vigueur au 11/09/2026", () => {
  const normes = ["Euro 0", "Euro 1", "Euro 2", "Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6b", "Euro 6c", "Euro 6d-TEMP", "Euro 6d"];
  const rang = (norme: string) => Number(norme.match(/\d/)![0]);
  const minimum = {
    Diesel: { bruxelles: 6, anvers: 5, gand: 5 },
    Essence: { bruxelles: 3, anvers: 2, gand: 2 },
  } as const;

  for (const carburant of ["Diesel", "Essence"] as const) {
    it(`${carburant} : accès libre ville par ville selon la norme minimale`, () => {
      for (const norme of normes) {
        const statuts = statutParVille(carburant, norme);
        for (const ville of ["bruxelles", "anvers", "gand"] as const) {
          expect({ norme, ville, admis: admis(statuts[ville]) })
            .toEqual({ norme, ville, admis: rang(norme) >= minimum[carburant][ville] });
        }
      }
    });
  }

  it("compatible = admis dans les 3 villes : diesel Euro 6+, essence Euro 3+", () => {
    for (const norme of normes) {
      expect({ norme, diesel: isLezCompatible("Diesel", norme) }).toEqual({ norme, diesel: rang(norme) >= 6 });
      expect({ norme, essence: isLezCompatible("Essence", norme) }).toEqual({ norme, essence: rang(norme) >= 3 });
    }
  });

  it("Gand : l'essence Euro 1 exige un pass LEZ (pas d'accès libre)", () => {
    expect(statutParVille("Essence", "Euro 1").gand).toBe("interdit");
  });

  it("le GPL suit le calendrier de l'essence", () => {
    for (const norme of normes) {
      expect(statutParVille("GPL", norme)).toEqual(statutParVille("Essence", norme));
    }
    expect(isLezCompatible("GPL", "Euro 5")).toBe(true);
  });

  it("électrique et hydrogène sont exemptés, même sans norme Euro", () => {
    expect(isLezCompatible("Électrique", null)).toBe(true);
    expect(isLezCompatible("Hydrogène", null)).toBe(true);
    expect(calculerStatutLEZ("Hydrogène", "").global.statut).toBe("autorise");
  });
});

describe("cas limites", () => {
  it("carburant absent, norme absente ou illisible → non compatible", () => {
    expect(isLezCompatible(null, "Euro 6")).toBe(false);
    expect(isLezCompatible("", "Euro 6")).toBe(false);
    expect(isLezCompatible("Diesel", null)).toBe(false);
    expect(isLezCompatible("Diesel", "Non spécifié")).toBe(false);
  });

  it("auditLezFlag applique la même règle", () => {
    expect(auditLezFlag({ fuelType: "Diesel", euroNorm: "Euro 5", storedFlag: true })).toMatchObject({ expected: false, actual: true });
    expect(auditLezFlag({ fuelType: "Essence", euroNorm: "Euro 3", storedFlag: true })).toBeNull();
  });
});

describe("électrique, hydrogène et hybride — exemptés dans les 3 villes", () => {
  const normes = ["Euro 0", "Euro 4", "Euro 6d", "", "Non spécifié"];
  const exemptes = ["Électrique", "Electric", "Hydrogène", "Waterstof", "Hybride", "Hybride rechargeable"];

  for (const carburant of exemptes) {
    it(`${carburant} : autorisé à Bruxelles, Anvers et Gand quelle que soit la norme`, () => {
      for (const norme of normes) {
        expect({ norme, statuts: statutParVille(carburant, norme) }).toEqual({
          norme,
          statuts: { bruxelles: "autorise", anvers: "autorise", gand: "autorise" },
        });
        expect({ norme, compatible: isLezCompatible(carburant, norme) }).toEqual({ norme, compatible: true });
      }
    });
  }
});

// Ce que la carte affiche : message, couleur et compte à rebours. Les échéances
// sont relatives à l'année figée en tête de fichier (2026).
describe("badges LEZ : message, couleur et échéance", () => {
  const detail = (carburant: string, norme: string, ville: string) =>
    calculerStatutLEZ(carburant, norme).details.find((d) => d.ville === ville)!;

  it("Bruxelles, essence Euro 3 : interdite dès 2028 → orange, « Plus que 2 ans »", () => {
    expect(detail("Essence", "Euro 3", "bruxelles")).toEqual({
      ville: "bruxelles",
      statut: "alerte",
      message: "Interdit dès 2028",
      messageDetail: "Plus que 2 ans",
      couleur: "orange",
      anneesRestantes: 2,
      anneeInterdiction: 2028,
    });
  });

  it("Bruxelles, diesel Euro 6 : fin du diesel en 2030 → orange, 4 ans restants", () => {
    expect(detail("Diesel", "Euro 6", "bruxelles")).toMatchObject({
      statut: "alerte",
      couleur: "orange",
      anneesRestantes: 4,
      anneeInterdiction: 2030,
    });
  });

  it("Bruxelles, essence Euro 5 : échéance 2035 à plus de 5 ans → vert, « Situation stable »", () => {
    expect(detail("Essence", "Euro 5", "bruxelles")).toEqual({
      ville: "bruxelles",
      statut: "autorise",
      message: "Autorisé jusqu'en 2035",
      messageDetail: "Situation stable",
      couleur: "green",
      anneeInterdiction: 2035,
    });
  });

  it("Anvers, diesel Euro 5 : aucune échéance programmée → vert, sans année", () => {
    expect(detail("Diesel", "Euro 5", "anvers")).toEqual({
      ville: "anvers",
      statut: "autorise",
      message: "Autorisé",
      messageDetail: "Aucune restriction prévue",
      couleur: "green",
    });
  });

  it("Bruxelles, diesel Euro 4 : rouge, sans échéance à afficher", () => {
    expect(detail("Diesel", "Euro 4", "bruxelles")).toEqual({
      ville: "bruxelles",
      statut: "interdit",
      message: "Interdit",
      messageDetail: "Circulation interdite",
      couleur: "red",
    });
  });

  it("norme illisible → gris « Vérification requise » dans les 3 villes", () => {
    const { global, details } = calculerStatutLEZ("Diesel", "Non spécifié");
    expect(details.map((d) => d.statut)).toEqual(["inconnu", "inconnu", "inconnu"]);
    expect(global).toMatchObject({
      statut: "inconnu",
      couleur: "gray",
      message: "Vérification requise",
      // La norme est écartée avant d'être cherchée dans le calendrier : le
      // message « Norme inconnue » ne sert qu'aux normes absentes du calendrier.
      messageDetail: "Norme ou carburant non spécifié",
    });
  });

  it("carburant non reconnu → gris, même avec une norme valide", () => {
    expect(statutParVille("Bois", "Euro 6")).toEqual({
      bruxelles: "inconnu",
      anvers: "inconnu",
      gand: "inconnu",
    });
    expect(calculerStatutLEZ("Bois", "Euro 6").global.messageDetail).toBe("Norme ou carburant non spécifié");
  });

  it("le verdict global retient la ville la plus restrictive", () => {
    // Diesel Euro 5 : interdit à Bruxelles, autorisé à Anvers et Gand.
    expect(calculerStatutLEZ("Diesel", "Euro 5").global.ville).toBe("bruxelles");
    // Essence Euro 3 : alerte à Bruxelles (2028), autorisé sans limite ailleurs.
    expect(calculerStatutLEZ("Essence", "Euro 3").global.ville).toBe("bruxelles");
  });
});
