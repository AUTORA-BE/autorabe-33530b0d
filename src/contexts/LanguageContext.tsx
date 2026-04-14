import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type Language = "fr" | "nl" | "de" | "en";

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
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    if (saved && (saved === "fr" || saved === "nl" || saved === "de" || saved === "en")) {
      return saved as Language;
    }
    return detectBrowserLanguage();
  });

  const [currentTranslations, setCurrentTranslations] = useState<Record<string, string>>(
    translationsCache[language] || frTranslations
  );

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
