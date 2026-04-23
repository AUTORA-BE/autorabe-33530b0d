import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://autora.be";
const LANGS = ["fr", "nl", "de", "en"] as const;
type Lang = (typeof LANGS)[number];

// Localized slug per language for shared paths.
// Keys are canonical (FR-style); values are per-lang segments.
const PATH_MAP: Record<string, Record<Lang, string>> = {
  "/": { fr: "/", nl: "/", de: "/", en: "/" },
  "/about": { fr: "/a-propos", nl: "/over-ons", de: "/ueber-uns", en: "/about" },
  "/sell": { fr: "/vendre", nl: "/verkopen", de: "/verkaufen", en: "/sell" },
  "/faq": { fr: "/faq", nl: "/faq", de: "/faq", en: "/faq" },
  "/contact": { fr: "/contact", nl: "/contact", de: "/kontakt", en: "/contact" },
  "/pricing": { fr: "/tarifs", nl: "/prijzen", de: "/preise", en: "/pricing" },
  "/calculateur-tco": { fr: "/calculateur-tco", nl: "/calculateur-tco", de: "/calculateur-tco", en: "/calculateur-tco" },
  "/compare": { fr: "/compare", nl: "/compare", de: "/compare", en: "/compare" },
  "/services": { fr: "/services", nl: "/diensten", de: "/dienste", en: "/services" },
  "/guide/lez-belgique": { fr: "/guide/lez-belgique", nl: "/guide/lez-belgique", de: "/guide/lez-belgique", en: "/guide/lez-belgique" },
  "/guide/car-pass": { fr: "/guide/car-pass", nl: "/guide/car-pass", de: "/guide/car-pass", en: "/guide/car-pass" },
  "/guide/acheter-voiture-occasion": { fr: "/guide/acheter-voiture-occasion", nl: "/guide/acheter-voiture-occasion", de: "/guide/acheter-voiture-occasion", en: "/guide/acheter-voiture-occasion" },
  "/terms": { fr: "/terms", nl: "/terms", de: "/terms", en: "/terms" },
  "/privacy": { fr: "/privacy", nl: "/privacy", de: "/privacy", en: "/privacy" },
  "/legal": { fr: "/legal", nl: "/legal", de: "/legal", en: "/legal" },
};

const CAR_SEG: Record<Lang, string> = { fr: "/voiture", nl: "/auto", de: "/auto", en: "/car" };

const META: Record<string, { changefreq: string; priority: string }> = {
  "/": { changefreq: "daily", priority: "1.0" },
  "/about": { changefreq: "monthly", priority: "0.8" },
  "/sell": { changefreq: "weekly", priority: "0.9" },
  "/faq": { changefreq: "weekly", priority: "0.7" },
  "/contact": { changefreq: "monthly", priority: "0.6" },
  "/pricing": { changefreq: "monthly", priority: "0.8" },
  "/calculateur-tco": { changefreq: "monthly", priority: "0.7" },
  "/compare": { changefreq: "weekly", priority: "0.6" },
  "/services": { changefreq: "monthly", priority: "0.8" },
  "/guide/lez-belgique": { changefreq: "monthly", priority: "0.8" },
  "/guide/car-pass": { changefreq: "monthly", priority: "0.8" },
  "/guide/acheter-voiture-occasion": { changefreq: "monthly", priority: "0.8" },
  "/terms": { changefreq: "yearly", priority: "0.3" },
  "/privacy": { changefreq: "yearly", priority: "0.3" },
  "/legal": { changefreq: "yearly", priority: "0.3" },
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const buildVehicleSlug = (v: { id: string; brand?: string | null; model?: string | null; year?: number | null; location?: string | null }) => {
  const parts = [v.brand, v.model, v.year?.toString(), v.location]
    .filter(Boolean)
    .map((p) => slugify(String(p)))
    .filter((p) => p.length > 0);
  return parts.length ? `${parts.join("-")}-${v.id}` : v.id;
};

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: listings } = await supabase
      .from("car_listings_public")
      .select("id, brand, model, year, location, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(5000);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Static pages: emit one entry per language with full alternates
    for (const [canonical, meta] of Object.entries(META)) {
      const paths = PATH_MAP[canonical];
      if (!paths) continue;
      for (const lang of LANGS) {
        const localized = paths[lang];
        const loc = `${SITE_URL}/${lang}${localized === "/" ? "" : localized}`;
        xml += `  <url>
    <loc>${loc}</loc>
`;
        for (const altLang of LANGS) {
          const altPath = paths[altLang];
          xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${SITE_URL}/${altLang}${altPath === "/" ? "" : altPath}"/>
`;
        }
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/fr${paths.fr === "/" ? "" : paths.fr}"/>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>
`;
      }
    }

    // Dynamic vehicle pages: one entry per language per vehicle, with SEO slug
    if (listings) {
      for (const listing of listings) {
        const lastmod = listing.updated_at
          ? new Date(listing.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        const slug = buildVehicleSlug(listing);
        for (const lang of LANGS) {
          const loc = `${SITE_URL}/${lang}${CAR_SEG[lang]}/${slug}`;
          xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
`;
          for (const altLang of LANGS) {
            xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${SITE_URL}/${altLang}${CAR_SEG[altLang]}/${slug}"/>
`;
          }
          xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/fr${CAR_SEG.fr}/${slug}"/>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
