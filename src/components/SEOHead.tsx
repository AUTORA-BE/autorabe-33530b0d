import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  /** JSON-LD structured data object(s) — rendered as <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SEOHead = ({
  title,
  description,
  image = "https://autora.be/og-image.jpg",
  url,
  type = "website",
  noIndex = false,
  jsonLd,
}: SEOHeadProps) => {
  const { language } = useLanguage();

  const defaultTitles: Record<string, string> = {
    fr: "AutoRa | Trouvez votre prochaine voiture en Belgique",
    nl: "AutoRa | Vind uw volgende auto in België",
    de: "AutoRa | Finden Sie Ihr nächstes Auto in Belgien",
    en: "AutoRa | Find your next car in Belgium",
  };

  const defaultDescriptions: Record<string, string> = {
    fr: "AutoRa - La marketplace automobile belge de confiance. Trouvez des milliers de véhicules vérifiés avec Car-Pass et compatibilité LEZ garantie.",
    nl: "AutoRa - De betrouwbare Belgische automarkt. Vind duizenden geverifieerde voertuigen met Car-Pass en gegarandeerde LEZ-compatibiliteit.",
    de: "AutoRa - Der vertrauenswürdige belgische Automarktplatz. Finden Sie Tausende verifizierte Fahrzeuge mit Car-Pass und garantierter LEZ-Kompatibilität.",
    en: "AutoRa - The trusted Belgian car marketplace. Find thousands of verified vehicles with Car-Pass and guaranteed LEZ compatibility.",
  };

  const locales: Record<string, string> = {
    fr: "fr_BE",
    nl: "nl_BE",
    de: "de_BE",
    en: "en_GB",
  };

  const fullTitle = title ? `${title} | AutoRa` : defaultTitles[language] || defaultTitles.fr;
  const fullDescription = description || defaultDescriptions[language] || defaultDescriptions.fr;
  const locale = locales[language] || "fr_BE";

  // Build canonical + hreflang URLs from current path
  const SITE = "https://autora.be";
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const stripLang = (p: string) => p.replace(/^\/(?:fr|nl|de|en)(?=\/|$)/, "") || "/";
  const pathNoLang = stripLang(currentPath);
  const canonicalUrl = url || `${SITE}/${language}${pathNoLang === "/" ? "" : pathNoLang}`;
  const altFor = (lng: string) =>
    `${SITE}/${lng}${pathNoLang === "/" ? "" : pathNoLang}`;

  // Normalize jsonLd to array
  const jsonLdItems = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet>
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="AutoRa" />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Alternate languages — real localized URLs */}
      <link rel="alternate" hrefLang="fr" href={altFor("fr")} />
      <link rel="alternate" hrefLang="nl" href={altFor("nl")} />
      <link rel="alternate" hrefLang="de" href={altFor("de")} />
      <link rel="alternate" hrefLang="en" href={altFor("en")} />
      <link rel="alternate" hrefLang="x-default" href={altFor("fr")} />

      {/* JSON-LD Structured Data */}
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
