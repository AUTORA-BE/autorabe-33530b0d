import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
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
        name: "AutoRa — Marketplace automobile belge",
        short_name: "AutoRa",
        description: "Trouvez votre prochaine voiture en Belgique. Véhicules vérifiés Car-Pass, conformité LEZ garantie.",
        theme_color: "#0a0a14",
        background_color: "#0a0a14",
        display: "standalone",
        orientation: "portrait",
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
            label: "AutoRa — Marketplace automobile belge",
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
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
