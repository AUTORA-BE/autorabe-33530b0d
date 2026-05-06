// Sitemap index — référence un sitemap par langue pour AutoRa
// Best practice Google : un sitemap par langue, regroupés par un index.
const SITE_URL = "https://autora.be";
const SUPABASE_PROJECT_REF = "okeiblbufwhfirxrzkfo";
const FUNCTIONS_BASE = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1`;
const LANGS = ["fr", "nl", "de", "en"] as const;

Deno.serve(() => {
  const lastmod = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const lang of LANGS) {
    xml += `  <sitemap>
    <loc>${FUNCTIONS_BASE}/dynamic-sitemap?lang=${lang}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
`;
  }

  xml += `</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
