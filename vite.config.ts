import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// IMPORTANT: this file is intentionally written in plain JavaScript syntax
// (no `type` imports, no `: Type` annotations, no `as` casts, no generics).
//
// Cloudflare Wrangler's vite-config codemod (esprima 4.0.1 + recast 0.23.11
// + @cloudflare/codemod) parses the file as standard ECMAScript. Any
// TypeScript-only syntax causes the parser to throw, and Wrangler then
// reports the misleading "could not find a valid plugins array" error.
// Vite itself still type-checks via tsc separately — keeping the file
// JS-clean only affects the codemod path, not the build.
//
// Likewise the PWA options are hoisted into a top-level const so the
// `plugins` array remains a trivially-shallow ArrayExpression of three
// CallExpressions.
const pwaOptions = {
  registerType: "autoUpdate" as const,
  devOptions: { enabled: false },
  includeAssets: ["favicon.png", "favicon.ico", "notification.mp3", "sw-push.js", "offline.html"],
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/jbdsjqoonpieusfvkhyo\.supabase\.co\/rest\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "autora-api-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
          networkTimeoutSeconds: 3,
        },
      },
      {
        urlPattern: /^https:\/\/jbdsjqoonpieusfvkhyo\.supabase\.co\/storage\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "autora-images-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "autora-external-images",
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "autora-fonts",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
  },
  manifest: {
    name: "AutoRA — Marketplace automobile belge",
    short_name: "AutoRA",
    description: "Trouvez votre prochaine voiture en Belgique. Véhicules vérifiés Car-Pass, conformité LEZ garantie.",
    theme_color: "#0a0a14",
    background_color: "#0a0a14",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "any",
    start_url: "/?utm_source=pwa",
    scope: "/",
    id: "/",
    lang: "fr-BE",
    dir: "ltr",
    categories: ["auto", "shopping"],
    prefer_related_applications: false,
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "AutoRA — Marketplace automobile belge",
      },
    ],
    shortcuts: [
      {
        name: "Rechercher une voiture",
        short_name: "Rechercher",
        url: "/?source=shortcut",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Vendre ma voiture",
        short_name: "Vendre",
        url: "/sell?source=shortcut",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Mes favoris",
        short_name: "Favoris",
        url: "/favorites?source=shortcut",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Calculateur TCO",
        short_name: "TCO",
        url: "/calculateur-tco?source=shortcut",
        icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
      },
    ],
  },
};

const VENDOR_CHUNKS = {
  "vendor-react": ["react", "react-dom", "react-router-dom"],
  "vendor-query": ["@tanstack/react-query"],
  "vendor-motion": ["framer-motion"],
  "vendor-icons": ["lucide-react"],
  "vendor-supabase": ["@supabase/supabase-js"],
};

// Homepage sections are lazy-loaded individually, which produced dozens of
// micro-chunks (~30 JS requests just for the home). They are grouped into a
// single "home-sections" chunk here. Route-level splitting stays untouched.
const HOME_SECTION_MODULES = [
  "src/components/home/",
  "src/components/WhyAutoRA",
  "src/components/SellCarCTA",
  "src/components/HomeFAQ",
  "src/components/HomeReviewsSection",
  "src/components/LoadMoreGrid",
  "src/components/TcoFloatingButton",
  "src/features/search/components/EvBrandSection",
  "src/features/search/components/ThermalBrandCarousel",
  "src/features/search/components/FilterPanel",
];

/** @param {string} id */
const manualChunks = (id) => {
  const normalized = id.split("\\").join("/");
  if (normalized.includes("node_modules")) {
    for (const [chunk, deps] of Object.entries(VENDOR_CHUNKS)) {
      if (deps.some((dep) => normalized.includes(`node_modules/${dep}/`))) return chunk;
    }
    return undefined;
  }
  if (HOME_SECTION_MODULES.some((m) => normalized.includes(m))) return "home-sections";
  return undefined;
};

export default defineConfig({
  plugins: [react(), componentTagger(), VitePWA(pwaOptions as Parameters<typeof VitePWA>[0])],
  server: { host: "::", port: 8080 },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { rollupOptions: { output: { manualChunks } } },
  // Production hardening: strip dev-only console noise + debugger statements
  // from the bundle. console.error / console.warn are kept on purpose so real
  // runtime issues still surface (and can be forwarded to monitoring later).
  // esbuild only applies `pure`/`drop` during `vite build`, never in dev.
  esbuild: {
    drop: ["debugger"],
    pure: ["console.log", "console.info", "console.debug", "console.trace"],
  },
});
