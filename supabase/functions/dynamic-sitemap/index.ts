import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://autora.be";

const staticPages = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/about", changefreq: "monthly", priority: "0.8" },
  { loc: "/sell", changefreq: "weekly", priority: "0.9" },
  { loc: "/faq", changefreq: "weekly", priority: "0.7" },
  { loc: "/contact", changefreq: "monthly", priority: "0.6" },
  { loc: "/pricing", changefreq: "monthly", priority: "0.8" },
  { loc: "/calculateur-tco", changefreq: "monthly", priority: "0.7" },
  { loc: "/compare", changefreq: "weekly", priority: "0.6" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
  { loc: "/legal", changefreq: "yearly", priority: "0.3" },
];

const languages = ["fr", "nl", "de", "en"];

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active listings (id + updated_at)
    const { data: listings } = await supabase
      .from("car_listings_public")
      .select("id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Static pages with hreflang
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
`;
      for (const lang of languages) {
        xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${page.loc}?lang=${lang}"/>
`;
      }
      xml += `    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Dynamic vehicle pages
    if (listings) {
      for (const listing of listings) {
        const lastmod = listing.updated_at
          ? new Date(listing.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        xml += `  <url>
    <loc>${SITE_URL}/car/${listing.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
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
