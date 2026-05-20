/**
 * VehicleSEO — drop-in SEO head for a vehicle detail page (`/car/:id`).
 *
 * Wraps the global SEOHead with:
 *   - CTR-optimized <title> + meta description (Year · Brand · Model · Price · City)
 *   - Open Graph "product" type with og:image:width/height/alt
 *   - product:price:amount / product:price:currency / availability
 *   - Twitter summary_large_image card
 *   - Vehicle JSON-LD via `vehicleSchema()` (Google Vehicle Listing rich result)
 *   - LCP preload hint on the hero image
 *
 * Plug at the top of CarDetail.tsx:
 *
 *   <VehicleSEO vehicle={vehicle} url={absoluteUrl} />
 *
 * @module components/seo
 */

import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { vehicleSchema, organizationSchema } from "@/lib/seoSchemas";

const SITE = "https://autora.be";

export interface VehicleSEOInput {
  id: string;
  brand: string;
  model: string;
  trim?: string | null;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  euroNorm?: string | null;
  price: number;
  /** Hero image — used for OG / Twitter / preload. */
  image: string;
  /** Additional gallery images for the Vehicle.image array. */
  images?: string[];
  location: string;
  description?: string | null;
  sellerName?: string;
  sellerType?: string;
  firstRegistrationDate?: string | null;
  vin?: string | null;
  bodyType?: string | null;
  numberOfDoors?: number | null;
  numberOfSeats?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  enginePowerKw?: number | null;
  engineDisplacementCc?: number | null;
  driveWheelConfiguration?: string | null;
  hasCarPass?: boolean;
  isLezCompatible?: boolean;
}

interface VehicleSEOProps {
  vehicle: VehicleSEOInput;
  /** Override the canonical URL. Defaults to https://autora.be/car/{id}. */
  url?: string;
}

const FUEL_LABELS_FR: Record<string, string> = {
  essence: "Essence",
  diesel: "Diesel",
  electrique: "Électrique",
  hybride: "Hybride",
  lpg: "LPG",
};

const FUEL_LABELS_NL: Record<string, string> = {
  essence: "Benzine",
  diesel: "Diesel",
  electrique: "Elektrisch",
  hybride: "Hybride",
  lpg: "LPG",
};

const formatPrice = (price: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);

const formatKm = (km: number, locale: string) =>
  new Intl.NumberFormat(locale).format(km) + " km";

function buildTitle(v: VehicleSEOInput, language: string): string {
  const headline = [v.year, v.brand, v.model, v.trim].filter(Boolean).join(" ");
  const locale = language === "nl" ? "nl-BE" : language === "de" ? "de-BE" : language === "en" ? "en-GB" : "fr-BE";
  const price = formatPrice(v.price, locale);
  return `${headline} · ${price} · ${v.location} | AutoRA`;
}

function buildDescription(v: VehicleSEOInput, language: string): string {
  const locale = language === "nl" ? "nl-BE" : language === "de" ? "de-BE" : language === "en" ? "en-GB" : "fr-BE";
  const price = formatPrice(v.price, locale);
  const km = formatKm(v.mileage, locale);
  const fuel =
    (language === "nl" ? FUEL_LABELS_NL : FUEL_LABELS_FR)[v.fuelType.toLowerCase()] ||
    v.fuelType;
  const power = v.enginePowerKw ? ` · ${Math.round(v.enginePowerKw * 1.36)} ch` : "";
  const trustBadges: string[] = [];
  if (v.hasCarPass) trustBadges.push("Car-Pass certifié");
  if (v.isLezCompatible) trustBadges.push("LEZ Belgique");
  const trust = trustBadges.length ? ` ✓ ${trustBadges.join(" ✓ ")}.` : "";

  if (language === "nl") {
    return `${v.brand} ${v.model} (${v.year}), ${km}, ${fuel}${power}, ${v.transmission}, ${price} in ${v.location}.${trust} Direct contact verkoper op AutoRA — de Belgische automarktplaats.`;
  }
  if (language === "de") {
    return `${v.brand} ${v.model} (${v.year}), ${km}, ${fuel}${power}, ${v.transmission}, ${price} in ${v.location}.${trust} Direkter Verkäuferkontakt auf AutoRA — der belgische Automarktplatz.`;
  }
  if (language === "en") {
    return `${v.brand} ${v.model} (${v.year}), ${km}, ${fuel}${power}, ${v.transmission}, ${price} in ${v.location}.${trust} Direct seller contact on AutoRA — the Belgian car marketplace.`;
  }
  return `${v.brand} ${v.model} (${v.year}), ${km}, ${fuel}${power}, ${v.transmission}, ${price} à ${v.location}.${trust} Contact direct vendeur sur AutoRA — la marketplace automobile belge.`;
}

const localeMap: Record<string, string> = {
  fr: "fr_BE",
  nl: "nl_BE",
  de: "de_BE",
  en: "en_GB",
};

export function VehicleSEO({ vehicle, url }: VehicleSEOProps) {
  const { language } = useLanguage();

  const canonical = url || `${SITE}/car/${vehicle.id}`;
  const title = buildTitle(vehicle, language);
  const description = buildDescription(vehicle, language);
  const ogLocale = localeMap[language] || "fr_BE";

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : [vehicle.image];

  const schema = vehicleSchema(vehicle);

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical & hreflang for Belgium */}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="fr-BE" href={canonical} />
      <link rel="alternate" hrefLang="nl-BE" href={canonical} />
      <link rel="alternate" hrefLang="de-BE" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph — "product" type for marketplace richness */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="AutoRA" />
      <meta property="og:locale" content={ogLocale} />

      {images.slice(0, 4).map((img, i) => (
        <meta key={`og-img-${i}`} property="og:image" content={img} />
      ))}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`} />

      {/* Product OG (Facebook + LinkedIn product unfurls) */}
      <meta property="product:price:amount" content={String(vehicle.price)} />
      <meta property="product:price:currency" content="EUR" />
      <meta property="product:availability" content="in stock" />
      <meta property="product:condition" content="used" />
      <meta property="product:retailer_item_id" content={vehicle.id} />
      <meta property="product:brand" content={vehicle.brand} />
      <meta property="product:category" content="Vehicles & Parts > Vehicles > Motor Vehicles > Cars" />

      {/* Twitter Card — large image */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={vehicle.image} />
      <meta name="twitter:image:alt" content={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`} />
      <meta name="twitter:site" content="@autora_be" />

      {/* Geo-targeting Belgium */}
      <meta name="geo.region" content="BE" />
      <meta name="geo.placename" content={vehicle.location} />

      {/* LCP preload — tells the browser to fetch the hero image ASAP */}
      <link
        rel="preload"
        as="image"
        href={vehicle.image}
        // @ts-expect-error — fetchpriority is a valid HTML attribute,
        // not yet in the React typings for <link>
        fetchpriority="high"
      />

      {/* JSON-LD structured data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

export default VehicleSEO;
