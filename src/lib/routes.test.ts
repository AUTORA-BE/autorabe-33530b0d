import { describe, it, expect } from "vitest";
import { localizedPath, stripLangPrefix, langFromPath, canonicalSegment } from "./routes";

describe("localizedPath", () => {
  it("préfixe la racine avec la langue", () => {
    expect(localizedPath("/", "nl")).toBe("/nl");
    expect(localizedPath("", "de")).toBe("/de");
  });

  it("traduit un segment canonique", () => {
    expect(localizedPath("/search", "nl")).toBe("/nl/zoeken");
    expect(localizedPath("/sell", "de")).toBe("/de/verkaufen");
  });

  // Régression : un segment déjà localisé (cas réel des <NavLink to="/recherche">
  // du Header) doit être re-traduit, pas recopié tel quel.
  it("re-traduit un segment déjà localisé dans une autre langue", () => {
    expect(localizedPath("/recherche", "nl")).toBe("/nl/zoeken");
    expect(localizedPath("/zoeken", "fr")).toBe("/fr/recherche");
    expect(localizedPath("/verkopen", "en")).toBe("/en/sell");
    expect(localizedPath("/a-propos", "nl")).toBe("/nl/over-ons");
  });

  it("conserve la queue de l'URL intacte", () => {
    expect(localizedPath("/car/bmw-serie-3-2020-uuid", "nl")).toBe("/nl/auto/bmw-serie-3-2020-uuid");
  });

  it("laisse passer un segment inconnu", () => {
    expect(localizedPath("/mes-alertes", "nl")).toBe("/nl/mes-alertes");
  });

  it("est idempotent sur un chemin déjà préfixé", () => {
    expect(localizedPath("/nl/zoeken", "nl")).toBe("/nl/zoeken");
  });
});

describe("stripLangPrefix", () => {
  it("retire un préfixe de langue supporté", () => {
    expect(stripLangPrefix("/nl/zoeken")).toBe("/zoeken");
    expect(stripLangPrefix("/fr")).toBe("/");
  });
  it("ne touche pas un préfixe non supporté", () => {
    expect(stripLangPrefix("/es/buscar")).toBe("/es/buscar");
  });
});

describe("langFromPath / canonicalSegment", () => {
  it("extrait la langue", () => {
    expect(langFromPath("/de/suche")).toBe("de");
    expect(langFromPath("/suche")).toBeNull();
  });
  it("ramène un segment localisé au canonique", () => {
    expect(canonicalSegment("zoeken")).toBe("search");
    expect(canonicalSegment("inconnu")).toBe("inconnu");
  });
});
