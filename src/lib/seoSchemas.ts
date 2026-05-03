/**
 * Centralized JSON-LD schema builders for SEO
 * @module lib/seoSchemas
 */

const SITE_URL = "https://autora.be";
const SITE_NAME = "AutoRa";
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

/** Vehicle listing (Car + Offer) */
export function vehicleSchema(car: {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  euroNorm: string;
  price: number;
  image: string;
  location: string;
  description?: string | null;
  sellerName?: string;
  sellerType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${car.brand} ${car.model}`,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileage,
      unitCode: "KMT",
    },
    fuelType: car.fuelType,
    vehicleTransmission: car.transmission,
    vehicleConfiguration: car.euroNorm,
    image: car.image,
    ...(car.description && { description: car.description.slice(0, 300) }),
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/car/${car.id}`,
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": car.sellerType === "professionnel" ? "Organization" : "Person",
        name: car.sellerName || "Vendeur vérifié",
      },
    },
    vehicleInteriorColor: undefined,
    driveWheelConfiguration: undefined,
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
