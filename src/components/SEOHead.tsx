import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { organizationSchema, websiteSchema } from "@/lib/seoSchemas";

/**
 * Product metadata for marketplace unfurls (Facebook / LinkedIn) — merged in
 * from the former `components/seo/VehicleSEO.tsx`, which is now deleted.
 */
export interface SEOProduct {
  /** Listing id, used as product:retailer_item_id */
  id: string;
  price: number;
  brand?: string;
  /** Alt text for og:image / twitter:image */
  imageAlt?: string;
  /** Extra gallery images (max 4 emitted, hero first) */
  images?: string[];
  /** City / region — refines geo.placename */
  location?: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  /** JSON-LD structured data object(s) — rendered as <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Emit product:* OG tags + LCP preload of the hero image. */
  product?: SEOProduct;
}

const SEOHead = ({
  title,
  description,
  image = "https://autora.be/og-image.jpg",
  url,
  type = "website",
  noIndex = false,
  jsonLd,
  product,
}: SEOHeadProps) => {

  const { language } = useLanguage();

  const defaultTitles: Record<string, string> = {
    fr: "AutoRA | Trouvez votre prochaine voiture en Belgique",
    nl: "AutoRA | Vind uw volgende auto in België",
    de: "AutoRA | Finden Sie Ihr nächstes Auto in Belgien",
    en: "AutoRA | Find your next car in Belgium",
  };

  const defaultDescriptions: Record<string, string> = {
    fr: "AutoRA - La marketplace automobile belge. Véhicules vérifiés Car-Pass, compatibilité LEZ et simulateurs de taxes pour les trois régions.",
    nl: "AutoRA - De Belgische automarktplaats. Voertuigen met Car-Pass-controle, LEZ-compatibiliteit en belastingsimulatoren voor de drie gewesten.",
    de: "AutoRA - Der belgische Automarktplatz. Fahrzeuge mit Car-Pass-Prüfung, LEZ-Kompatibilität und Steuerrechner für alle drei Regionen.",
    en: "AutoRA - The Belgian car marketplace. Car-Pass verified vehicles, LEZ compatibility and tax simulators for all three regions.",
  };


  const locales: Record<string, string> = {
    fr: "fr_BE",
    nl: "nl_BE",
    de: "de_BE",
    en: "en_GB",
  };

  const fullTitle = title
    ? (title.includes("AutoRA") ? title : `${title} | AutoRA`)
    : defaultTitles[language] || defaultTitles.fr;
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

  // Global schemas always injected + page-specific ones
  const jsonLdItems = [
    organizationSchema,
    websiteSchema,
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
  ];

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
      {product?.images?.filter((img) => img !== image).slice(0, 3).map((img, i) => (
        <meta key={`og-img-${i}`} property="og:image" content={img} />
      ))}
      {product?.imageAlt && <meta property="og:image:alt" content={product.imageAlt} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="AutoRA" />
      <meta property="og:locale" content={locale} />

      {/* Product OG (Facebook + LinkedIn product unfurls) */}
      {product && <meta property="product:price:amount" content={String(product.price)} />}
      {product && <meta property="product:price:currency" content="EUR" />}
      {product && <meta property="product:availability" content="in stock" />}
      {product && <meta property="product:condition" content="used" />}
      {product && <meta property="product:retailer_item_id" content={product.id} />}
      {product?.brand && <meta property="product:brand" content={product.brand} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      {product?.imageAlt && <meta name="twitter:image:alt" content={product.imageAlt} />}

      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* ────────────────────────────────────────────────────────────────────
          hreflang — Belgian-domestic targeting.

          We emit BOTH the regional `xx-BE` codes (precise audience) AND the
          generic `xx` codes (broader fallback), so Google understands the
          page targets Belgian speakers of each language WITHOUT being
          confused with .fr / .nl / .de national markets.

          - fr-BE  → French-speaking Belgians (Wallonia + Brussels)
          - nl-BE  → Dutch-speaking Belgians  (Flanders  + Brussels)
          - de-BE  → German-speaking community (East Cantons / Ostbelgien)
          - en     → international / generic English fallback
          - x-default → most common audience (fr-BE)

          The href URL itself doesn't need to encode "-BE" in the path —
          the hreflang attribute does the geo-signal job for crawlers.
          ──────────────────────────────────────────────────────────────────── */}
      <link rel="alternate" hrefLang="fr-BE" href={altFor("fr")} />
      <link rel="alternate" hrefLang="nl-BE" href={altFor("nl")} />
      <link rel="alternate" hrefLang="de-BE" href={altFor("de")} />
      <link rel="alternate" hrefLang="fr"    href={altFor("fr")} />
      <link rel="alternate" hrefLang="nl"    href={altFor("nl")} />
      <link rel="alternate" hrefLang="de"    href={altFor("de")} />
      <link rel="alternate" hrefLang="en"    href={altFor("en")} />
      <link rel="alternate" hrefLang="x-default" href={altFor("fr")} />

      {/* Geo-targeting meta (legacy but still parsed by some bots) */}
      <meta name="geo.region" content="BE" />
      <meta name="geo.placename" content="Belgium" />
      <meta name="ICBM" content="50.8503, 4.3517" />
      <meta name="DC.coverage" content="Belgium" />

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
