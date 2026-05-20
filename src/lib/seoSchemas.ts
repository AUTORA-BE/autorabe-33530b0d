/**
 * Centralized JSON-LD schema builders for SEO
 * @module lib/seoSchemas
 */

const SITE_URL = "https://autora.be";
const SITE_NAME = "AutoRA";
const LOGO_URL = `${SITE_URL}/logo.png`;

/** Organization schema — reused across pages */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["French", "Dutch", "German", "English"],
  },
};

/** WebSite schema with SearchAction for sitelinks search box */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * Vehicle listing — Schema.org `Car` (subtype of `Vehicle`) + nested `Offer`.
 *
 * Designed to satisfy every required and recommended field for Google's
 * Vehicle Listing rich result on Search.
 * https://developers.google.com/search/docs/appearance/structured-data/vehicle-listing
 *
 * Required by Google : brand, model, price, vehicleIdentificationNumber (if known)
 * Strongly recommended : mileageFromOdometer, dateVehicleFirstRegistered,
 *                        fuelType, vehicleTransmission, bodyType, color, image,
 *                        itemCondition.
 */
export function vehicleSchema(car: {
  id: string;
  brand: string;
  model: string;
  /** Display variant / trim (e.g. "Competition xDrive Touring"). Optional. */
  trim?: string | null;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  euroNorm?: string | null;
  price: number;
  /** Hero image URL. */
  image: string;
  /** Additional gallery images (used as the Vehicle.image array). */
  images?: string[];
  location: string;
  description?: string | null;
  sellerName?: string;
  sellerType?: string;
  /** First registration in ISO 8601 (YYYY-MM-DD). Falls back to year-01-01. */
  firstRegistrationDate?: string | null;
  /** VIN — when available, dramatically boosts trust + eligibility. */
  vin?: string | null;
  /** Car / SUV / Hatchback / Wagon … */
  bodyType?: string | null;
  numberOfDoors?: number | null;
  numberOfSeats?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  /** kW or hp — power output. */
  enginePowerKw?: number | null;
  /** cm³ engine displacement. */
  engineDisplacementCc?: number | null;
  /** "AllWheelDriveConfiguration" | "FrontWheelDriveConfiguration" | … */
  driveWheelConfiguration?: string | null;
}) {
  const url = `${SITE_URL}/car/${car.id}`;
  const headline = [car.brand, car.model, car.trim].filter(Boolean).join(" ");
  const images = car.images && car.images.length > 0 ? car.images : [car.image];

  // Belgium fuel-type → schema.org enum mapping (Google is strict on these)
  const FUEL_MAP: Record<string, string> = {
    essence: "https://schema.org/Gasoline",
    diesel: "https://schema.org/Diesel",
    electrique: "https://schema.org/Electric",
    électrique: "https://schema.org/Electric",
    electric: "https://schema.org/Electric",
    hybride: "https://schema.org/Hybrid",
    hybrid: "https://schema.org/Hybrid",
    lpg: "https://schema.org/Lpg",
    gpl: "https://schema.org/Lpg",
    cng: "https://schema.org/Cng",
  };
  const fuelTypeNormalized =
    FUEL_MAP[car.fuelType?.toLowerCase()] ?? car.fuelType;

  // priceValidUntil — 60 days from now, ISO date
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 60);
  const priceValidUntil = validUntil.toISOString().slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: headline,
    url,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    dateVehicleFirstRegistered:
      car.firstRegistrationDate || `${car.year}-01-01`,
    itemCondition: "https://schema.org/UsedCondition",
    image: images,
    ...(car.vin && { vehicleIdentificationNumber: car.vin }),
    ...(car.description && { description: car.description.slice(0, 500) }),

    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileage,
      unitCode: "KMT",
    },
    fuelType: fuelTypeNormalized,
    vehicleTransmission: car.transmission,
    ...(car.euroNorm && { vehicleConfiguration: `Euro ${car.euroNorm}` }),
    ...(car.bodyType && { bodyType: car.bodyType }),
    ...(car.numberOfDoors && { numberOfDoors: car.numberOfDoors }),
    ...(car.numberOfSeats && {
      vehicleSeatingCapacity: {
        "@type": "QuantitativeValue",
        value: car.numberOfSeats,
      },
    }),
    ...(car.exteriorColor && { color: car.exteriorColor }),
    ...(car.interiorColor && { vehicleInteriorColor: car.interiorColor }),
    ...(car.driveWheelConfiguration && {
      driveWheelConfiguration: car.driveWheelConfiguration,
    }),
    ...((car.enginePowerKw || car.engineDisplacementCc) && {
      vehicleEngine: {
        "@type": "EngineSpecification",
        ...(car.enginePowerKw && {
          enginePower: {
            "@type": "QuantitativeValue",
            value: car.enginePowerKw,
            unitCode: "KWT",
          },
        }),
        ...(car.engineDisplacementCc && {
          engineDisplacement: {
            "@type": "QuantitativeValue",
            value: car.engineDisplacementCc,
            unitCode: "CMQ",
          },
        }),
        fuelType: fuelTypeNormalized,
      },
    }),

    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "EUR",
      priceValidUntil,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url,
      areaServed: { "@type": "Country", name: "BE" },
      availableAtOrFrom: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: car.location,
          addressCountry: "BE",
        },
      },
      seller: {
        "@type": car.sellerType === "professionnel" ? "AutoDealer" : "Person",
        name: car.sellerName || "Vendeur vérifié",
      },
    },
  };
}

/** FAQ page schema */
export function faqSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** BreadcrumbList schema */
export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** LocalBusiness schema for About page */
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description:
    "Marketplace automobile belge de confiance avec vérification Car-Pass et compatibilité LEZ.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "BE",
  },
  areaServed: {
    "@type": "Country",
    name: "Belgium",
  },
  priceRange: "€€",
};

/** ItemList schema for search results / popular vehicles */
export function itemListSchema(
  items: { name: string; url: string; position: number }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

/** AggregateOffer schema for homepage */
export function aggregateOfferSchema(opts: {
  lowPrice: number;
  highPrice: number;
  offerCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: opts.lowPrice,
    highPrice: opts.highPrice,
    offerCount: opts.offerCount,
    url: SITE_URL,
  };
}

/** HowTo schema for guide pages */
export function howToSchema(guide: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.name,
    description: guide.description,
    step: guide.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/** Article schema for guide/blog pages */
export function articleSchema(article: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: organizationSchema,
    publisher: organizationSchema,
  };
}

/** WebApplication schema for free tools (TCO calculator, tax simulator…) */
export function webApplicationSchema(app: {
  name: string;
  description: string;
  url: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: app.name,
    description: app.description,
    url: app.url,
    applicationCategory: app.category || "FinanceApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    inLanguage: ["fr-BE", "nl-BE", "de-BE", "en"],
    publisher: organizationSchema,
  };
}
