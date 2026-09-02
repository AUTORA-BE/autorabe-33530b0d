/**
 * Build-time Open Graph prerendering.
 *
 * Hosting for autora.be is Lovable Hosting (static, Cloudflare edge). There is
 * no request-time middleware available there — `public/_redirects` is ignored
 * and no edge function runs — so crawler user-agents can only ever receive a
 * static HTML file. This plugin therefore emits, at build time, one physical
 * HTML file per approved listing:
 *
 *   dist/car/<slug>/index.html
 *   dist/voiture/<slug>/index.html
 *
 * Each file is a byte-for-byte copy of the built index.html with the OG /
 * Twitter / canonical / JSON-LD tags rewritten for that vehicle. Real users
 * still boot the exact same SPA bundle (the file only differs in <head>),
 * while Facebook, LinkedIn and WhatsApp read the vehicle-specific preview.
 *
 * Listings published after the last deploy fall back to the generic site
 * preview until the next build.
 */
import fs from "node:fs/promises";
import path from "node:path";

const SITE_ORIGIN = "https://autora.be";
const BRAND = "AutoRA";
const MAX_LISTINGS = 2000;

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (s, max = 300) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const buildSlug = (v) => {
  const parts = [v.brand, v.model, v.year, v.location]
    .filter(Boolean)
    .map((p) => slugify(p))
    .filter(Boolean);
  return parts.length ? `${parts.join("-")}-${v.id}` : v.id;
};

/** Replace the content of an existing meta tag, or append it to <head>. */
const setMeta = (html, attr, name, content) => {
  const re = new RegExp(
    `<meta\\s+${attr}=["']${name}["'][^>]*>`,
    "i",
  );
  const tag = `<meta ${attr}="${name}" content="${esc(content)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `  ${tag}\n</head>`);
};

const renderHtml = (base, v) => {
  const url = `${SITE_ORIGIN}/car/${buildSlug(v)}`;
  const priceFmt = new Intl.NumberFormat("fr-BE").format(v.price ?? 0);
  const kmFmt = new Intl.NumberFormat("fr-BE").format(v.mileage ?? 0);
  const title = `${v.brand} ${v.model} ${v.year} — ${priceFmt} € | ${BRAND}`;
  const description = truncate(
    (v.description || "").trim() ||
      `${v.brand} ${v.model} ${v.year}, ${kmFmt} km, ${v.fuel_type}, ${v.transmission}${
        v.location ? `, ${v.location}` : ""
      }. À vendre sur ${BRAND}.`,
  );
  const image = (Array.isArray(v.photos) && v.photos[0]) || `${SITE_ORIGIN}/og-image.jpg`;

  let html = base;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:image", image);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:type", "product");
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "twitter:image", image);
  html = setMeta(html, "name", "twitter:card", "summary_large_image");

  const canonical = `<link rel="canonical" href="${esc(url)}">`;
  html = /<link\s+rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonical)
    : html.replace("</head>", `  ${canonical}\n</head>`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${v.brand} ${v.model} ${v.year}`,
    brand: { "@type": "Brand", name: v.brand },
    model: v.model,
    vehicleModelDate: String(v.year),
    bodyType: v.body_type || undefined,
    color: v.color || undefined,
    fuelType: v.fuel_type,
    vehicleTransmission: v.transmission,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: "KMT" },
    image,
    url,
    offers: {
      "@type": "Offer",
      price: v.price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url,
    },
  };
  html = html.replace(
    "</head>",
    `  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>\n</head>`,
  );

  return html;
};

async function fetchListings(supabaseUrl, anonKey) {
  const select =
    "id,brand,model,year,price,mileage,fuel_type,transmission,body_type,color,description,photos,location";
  const res = await fetch(
    `${supabaseUrl}/rest/v1/car_listings_public?select=${select}&order=created_at.desc&limit=${MAX_LISTINGS}`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
  );
  if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
  return res.json();
}

export function prerenderOgMeta() {
  return {
    name: "autora-prerender-og-meta",
    apply: "build",
    async closeBundle() {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !anonKey) {
        this.warn("[og-prerender] Supabase env missing — skipped.");
        return;
      }

      const outDir = path.resolve(process.cwd(), "dist");
      let base;
      try {
        base = await fs.readFile(path.join(outDir, "index.html"), "utf8");
      } catch {
        this.warn("[og-prerender] dist/index.html not found — skipped.");
        return;
      }

      let listings = [];
      try {
        listings = await fetchListings(supabaseUrl, anonKey);
      } catch (err) {
        // Never fail the production build because of a network hiccup.
        this.warn(`[og-prerender] listing fetch failed — skipped (${err}).`);
        return;
      }

      let count = 0;
      for (const v of listings) {
        if (!v?.id || !v.brand || !v.model) continue;
        const html = renderHtml(base, v);
        const slug = buildSlug(v);
        for (const prefix of ["car", "voiture"]) {
          const dir = path.join(outDir, prefix, slug);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
        }
        count += 1;
      }
      this.info?.(`[og-prerender] ${count} listing preview pages generated.`);
    },
  };
}

export default prerenderOgMeta;
