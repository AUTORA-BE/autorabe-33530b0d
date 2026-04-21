/**
 * Multilingual route slugs.
 * Maps a canonical (FR) path to its localized equivalent per language.
 * Used to build SEO-friendly URLs like /nl/auto/... or /de/suche.
 */
import type { Language } from "@/contexts/LanguageContext";

export const SUPPORTED_LANGS: Language[] = ["fr", "nl", "de", "en"];
export const DEFAULT_LANG: Language = "fr";

/**
 * Per-language slug map. Key = canonical path segment (FR), value = localized.
 * Only segments listed here get translated; unlisted segments pass through.
 */
const SLUG_MAP: Record<string, Partial<Record<Language, string>>> = {
  car: { fr: "voiture", nl: "auto", de: "auto", en: "car" },
  sell: { fr: "vendre", nl: "verkopen", de: "verkaufen", en: "sell" },
  search: { fr: "recherche", nl: "zoeken", de: "suche", en: "search" },
  favorites: { fr: "favoris", nl: "favorieten", de: "favoriten", en: "favorites" },
  about: { fr: "a-propos", nl: "over-ons", de: "ueber-uns", en: "about" },
  contact: { fr: "contact", nl: "contact", de: "kontakt", en: "contact" },
  pricing: { fr: "tarifs", nl: "prijzen", de: "preise", en: "pricing" },
  services: { fr: "services", nl: "diensten", de: "dienste", en: "services" },
  guide: { fr: "guide", nl: "gids", de: "ratgeber", en: "guide" },
  blog: { fr: "blog", nl: "blog", de: "blog", en: "blog" },
};

/** Reverse lookup: localized segment -> canonical (FR). */
const REVERSE_MAP: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [canonical, langs] of Object.entries(SLUG_MAP)) {
    out[canonical] = canonical;
    for (const localized of Object.values(langs)) {
      if (localized) out[localized] = canonical;
    }
  }
  return out;
})();

/**
 * Check if a string is a valid language code we support.
 */
export const isSupportedLang = (s: string | undefined): s is Language =>
  !!s && (SUPPORTED_LANGS as string[]).includes(s);

/**
 * Build a localized path for a given language.
 * Example: localizedPath("/car/abc-123", "nl") -> "/nl/auto/abc-123"
 * Example: localizedPath("/", "fr") -> "/fr"
 */
export const localizedPath = (path: string, lang: Language): string => {
  // Strip leading lang prefix if present, then re-prefix
  const cleaned = stripLangPrefix(path);
  if (cleaned === "" || cleaned === "/") return `/${lang}`;
  const [first, ...rest] = cleaned.replace(/^\//, "").split("/");
  const translated = SLUG_MAP[first]?.[lang] ?? first;
  const tail = rest.length ? `/${rest.join("/")}` : "";
  return `/${lang}/${translated}${tail}`;
};

/**
 * Remove a leading /{lang} prefix from a path. Returns the rest.
 */
export const stripLangPrefix = (path: string): string => {
  const match = path.match(/^\/([a-z]{2})(\/.*|$)/);
  if (match && isSupportedLang(match[1])) {
    return match[2] || "/";
  }
  return path;
};

/**
 * Extract language from a path's first segment, if supported.
 */
export const langFromPath = (path: string): Language | null => {
  const match = path.match(/^\/([a-z]{2})(?:\/|$)/);
  if (match && isSupportedLang(match[1])) return match[1];
  return null;
};

/**
 * Convert a localized URL segment back to its canonical (FR) form.
 * Used when matching dynamic translated routes.
 */
export const canonicalSegment = (segment: string): string =>
  REVERSE_MAP[segment] ?? segment;
