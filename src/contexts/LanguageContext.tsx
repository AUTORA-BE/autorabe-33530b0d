import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useLocation } from "react-router-dom";

type Language = "fr" | "nl" | "de" | "en";

const LANG_FROM_URL_RE = /^\/([a-z]{2})(?:\/|$)/;
const SUPPORTED: Language[] = ["fr", "nl", "de", "en"];

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Lazy-loaded translations cache
const translationsCache: Partial<Record<Language, Record<string, string>>> = {};

const loadTranslations = async (lang: Language): Promise<Record<string, string>> => {
  if (translationsCache[lang]) return translationsCache[lang]!;
  const mod = await import(`../i18n/${lang}.json`);
  translationsCache[lang] = mod.default;
  return mod.default;
};

// Pre-load French (default) synchronously via static import for instant FCP
import frTranslations from "../i18n/fr.json";
translationsCache.fr = frTranslations;

const languageLabels: Record<Language, string> = {
  fr: "FR",
  nl: "NL",
  de: "DE",
  en: "EN",
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "en") return "en";
  if (browserLang === "de") return "de";
  if (browserLang === "nl") return "nl";
  return "fr";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  const [language, setLanguageState] = useState<Language>(() => {
    // 1. URL prefix wins (deep links / SEO)
    const urlMatch = window.location.pathname.match(LANG_FROM_URL_RE);
    if (urlMatch && SUPPORTED.includes(urlMatch[1] as Language)) {
      return urlMatch[1] as Language;
    }
    // 2. localStorage
    const saved = localStorage.getItem("language");
    if (saved && SUPPORTED.includes(saved as Language)) {
      return saved as Language;
    }
    // 3. Browser
    return detectBrowserLanguage();
  });

  const [currentTranslations, setCurrentTranslations] = useState<Record<string, string>>(
    translationsCache[language] || frTranslations
  );

  // Sync language with URL prefix on every navigation
  useEffect(() => {
    const urlMatch = location.pathname.match(LANG_FROM_URL_RE);
    if (urlMatch && SUPPORTED.includes(urlMatch[1] as Language)) {
      const urlLang = urlMatch[1] as Language;
      if (urlLang !== language) {
        setLanguageState(urlLang);
        localStorage.setItem("language", urlLang);
      }
    }
  }, [location.pathname, language]);

  useEffect(() => {
    document.documentElement.lang = language;
    loadTranslations(language).then(setCurrentTranslations);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    return currentTranslations[key] || (frTranslations as Record<string, string>)[key] || key;
  }, [currentTranslations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const getLanguageLabel = (lang: Language) => languageLabels[lang];
