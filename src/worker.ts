/**
 * Cloudflare Worker — SSR meta tags for social crawlers.
 *
 * Runs BEFORE static assets (see wrangler.jsonc → assets.run_worker_first).
 * - If User-Agent is a known social/search crawler AND the path matches a
 *   garage or vehicle detail route → fetch real data from Supabase (anon,
 *   read-only RPC) and return a minimal HTML with OG / Twitter / JSON-LD.
 * - Otherwise → delegate to env.ASSETS.fetch(), which serves the SPA
 *   exactly as before (including the SPA fallback to index.html).
 *
 * Anon key is the public publishable key (safe in clients & workers).
 */

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const SUPABASE_URL = "https://jbdsjqoonpieusfvkhyo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZHNqcW9vbnBpZXVzZnZraHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTY2MzIsImV4cCI6MjA4MTE5MjYzMn0.O9oo6YjMyI6gjpGcSRCnk6GcDBBXj8PbUslDRV4jB0o";

const SITE_ORIGIN = "https://autora.be";
const BRAND_NAME = "AutoRA";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/placeholder.svg`;

// --- Crawler detection ---------------------------------------------------
// Case-insensitive substring match. Includes the prefetcher/preview bots
// because their previews are what users actually see when sharing.
const CRAWLER_PATTERNS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  "googlebot",
  "bingbot",
  "applebot",
  "duckduckbot",
  "yandexbot",
  "embedly",
  "pinterest",
  "redditbot",
  "skypeuripreview",
  "vkshare",
  "w3c_validator",
  "iframely",
] as const;

const isCrawler = (ua: string | null): boolean => {
  if (!ua) return false;
  const lc = ua.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => lc.includes(p));
};

// --- Helpers -------------------------------------------------------------
const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (s: string, max = 300): string =>
  s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;

const UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const extractUuid = (s: string): string | null => {
  const m = s.match(UUID_RE);
  return m ? m[1] : null;
};

// --- Supabase RPC calls (anon, read-only) --------------------------------
async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // cf-specific: cache RPC responses at the edge for 5 min to limit cost
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as T | T[];
    if (Array.isArray(data)) return (data[0] ?? null) as T | null;
    return data as T;
  } catch {
    return null;
  }
}

interface VitrineRow {
  user_id: string;
  display_name: string | null;
  garage_name: string | null;
  avatar_url: string | null;
  postal_code: string | null;
  vitrine_slug: string | null;
  vitrine_cover_url: string | null;
  vitrine_about: string | null;
  vitrine_services: string[] | null;
}

interface ListingRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string | null;
  color: string | null;
  description: string | null;
  photos: string[] | null;
  location: string | null;
  first_registration: string | null;
}

// --- HTML builders -------------------------------------------------------
interface MetaPayload {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "article" | "product";
  jsonLd: Record<string, unknown>;
}

const renderMetaHtml = (m: MetaPayload): string => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(m.title)}</title>
<meta name="description" content="${escapeHtml(m.description)}" />
<link rel="canonical" href="${escapeHtml(m.url)}" />

<meta property="og:site_name" content="${BRAND_NAME}" />
<meta property="og:title" content="${escapeHtml(m.title)}" />
<meta property="og:description" content="${escapeHtml(m.description)}" />
<meta property="og:image" content="${escapeHtml(m.image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(m.image)}" />
<meta property="og:url" content="${escapeHtml(m.url)}" />
<meta property="og:type" content="${m.type}" />
<meta property="og:locale" content="fr_BE" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(m.title)}" />
<meta name="twitter:description" content="${escapeHtml(m.description)}" />
<meta name="twitter:image" content="${escapeHtml(m.image)}" />

<script type="application/ld+json">${JSON.stringify(m.jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
<h1>${escapeHtml(m.title)}</h1>
<p>${escapeHtml(m.description)}</p>
<p><a href="${escapeHtml(m.url)}">${escapeHtml(m.url)}</a></p>
</body>
</html>`;

// --- Route handlers ------------------------------------------------------
async function handleGarage(slug: string, canonicalUrl: string): Promise<Response | null> {
  const row = await rpc<VitrineRow>("get_public_vitrine", { _slug_or_user: slug });
  if (!row) return null;

  const name = row.garage_name || row.display_name || "Garage";
  const title = `${name} — Garage automobile en Belgique | ${BRAND_NAME}`;
  const description = truncate(
    row.vitrine_about?.trim() ||
      `Découvrez ${name}, garage professionnel${row.postal_code ? ` à ${row.postal_code}` : ""} sur ${BRAND_NAME}. Voitures d'occasion contrôlées Car-Pass.`,
  );
  const image = row.vitrine_cover_url || row.avatar_url || DEFAULT_IMAGE;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name,
    url: canonicalUrl,
    image,
    description,
    address: row.postal_code
      ? {
          "@type": "PostalAddress",
          postalCode: row.postal_code,
          addressCountry: "BE",
        }
      : undefined,
    makesOffer: row.vitrine_services?.map((s) => ({ "@type": "Offer", name: s })) ?? undefined,
  };

  return new Response(
    renderMetaHtml({ title, description, image, url: canonicalUrl, type: "website", jsonLd }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=300",
        "x-ssr-meta": "garage",
      },
    },
  );
}

async function handleListing(idOrSlug: string, canonicalUrl: string): Promise<Response | null> {
  const id = extractUuid(idOrSlug) ?? idOrSlug;
  if (!UUID_RE.test(id)) return null;

  const row = await rpc<ListingRow>("get_public_listing", { _listing_id: id });
  if (!row) return null;

  const priceFmt = new Intl.NumberFormat("fr-BE").format(row.price);
  const mileageFmt = new Intl.NumberFormat("fr-BE").format(row.mileage);
  const title = `${row.brand} ${row.model} ${row.year} — ${priceFmt} € | ${BRAND_NAME}`;
  const description = truncate(
    row.description?.trim() ||
      `${row.brand} ${row.model} ${row.year}, ${mileageFmt} km, ${row.fuel_type}, ${row.transmission}${row.location ? `, ${row.location}` : ""}. À vendre sur ${BRAND_NAME}.`,
  );
  const image = row.photos?.[0] || DEFAULT_IMAGE;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${row.brand} ${row.model} ${row.year}`,
    brand: { "@type": "Brand", name: row.brand },
    model: row.model,
    vehicleModelDate: String(row.year),
    bodyType: row.body_type ?? undefined,
    color: row.color ?? undefined,
    fuelType: row.fuel_type,
    vehicleTransmission: row.transmission,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: row.mileage, unitCode: "KMT" },
    image,
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      price: row.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };

  return new Response(
    renderMetaHtml({ title, description, image, url: canonicalUrl, type: "product", jsonLd }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=300",
        "x-ssr-meta": "listing",
      },
    },
  );
}

// --- Path matching -------------------------------------------------------
// Matches must stay in sync with src/App.tsx routes.
const GARAGE_RE = /^\/(?:garage|vitrine|seller)\/([^/]+)\/?$/;
const LISTING_RE = /^\/(?:car|voiture|auto)\/([^/]+)\/?$/;

// --- Worker entry --------------------------------------------------------
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only intercept GET on the relevant SPA paths
    if (request.method === "GET" && isCrawler(request.headers.get("user-agent"))) {
      const canonical = `${SITE_ORIGIN}${url.pathname}`;

      const g = url.pathname.match(GARAGE_RE);
      if (g) {
        const r = await handleGarage(decodeURIComponent(g[1]), canonical);
        if (r) return r;
      }

      const l = url.pathname.match(LISTING_RE);
      if (l) {
        const r = await handleListing(decodeURIComponent(l[1]), canonical);
        if (r) return r;
      }
    }

    // Default: serve the SPA (static assets + SPA fallback to index.html)
    return env.ASSETS.fetch(request);
  },
};
