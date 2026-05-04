import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import App from "./App.tsx";
import { loadPlausibleIfAllowed } from "@/lib/consent";
import { initSentry } from "@/lib/sentry";
import "./index.css";

// Boot analytics only if user already accepted in a previous session
loadPlausibleIfAllowed();

// Error monitoring — no-ops unless VITE_SENTRY_DSN is set in Vercel env
initSentry();


// PWA guard: unregister service workers in iframe/preview contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      // eslint-disable-next-line no-console
      console.info(`[PWA] Unregistering ${registrations.length} stale service worker(s) in preview/iframe context`);
    }
    registrations.forEach((r) => r.unregister());
  });
  // Purge tout cache PWA résiduel qui pourrait servir une ancienne version du preview
  if (typeof caches !== "undefined") {
    caches.keys().then((keys) => {
      if (keys.length > 0) {
        // eslint-disable-next-line no-console
        console.info(`[PWA] Clearing ${keys.length} stale cache(s)`);
      }
      keys.forEach((k) => caches.delete(k));
    });
  }
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <App />
          </ThemeProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
