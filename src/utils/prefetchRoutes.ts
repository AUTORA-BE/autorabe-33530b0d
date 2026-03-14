/**
 * Route prefetch map — mirrors the lazy imports in App.tsx.
 * Calling a function triggers the dynamic import so the chunk is cached
 * before the user actually navigates.
 */
const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  "/auth": () => import("@/pages/Auth"),
  "/car": () => import("@/pages/CarDetail"),
  "/favorites": () => import("@/pages/Favorites"),
  "/sell": () => import("@/pages/SellCar"),
  "/messages": () => import("@/pages/Messages"),
  "/about": () => import("@/pages/About"),
  "/faq": () => import("@/pages/FAQ"),
  "/compare": () => import("@/pages/Compare"),
  "/dashboard": () => import("@/pages/SellerDashboard"),
  "/settings": () => import("@/pages/Settings"),
  "/contact": () => import("@/pages/Contact"),
  "/terms": () => import("@/pages/Terms"),
  "/privacy": () => import("@/pages/Privacy"),
  "/legal": () => import("@/pages/Legal"),
  "/calculateur-tco": () => import("@/pages/CalculateurTCO"),
  "/pricing": () => import("@/pages/Pricing"),
  "/mes-alertes": () => import("@/pages/MesAlertes"),
};

const prefetched = new Set<string>();

/**
 * Prefetch the JS chunk for a given route path.
 * Safe to call multiple times — each route is only fetched once.
 */
export function prefetchRoute(path: string): void {
  const key = routePrefetchMap[path] ? path : `/${path.split("/")[1]}`;

  if (prefetched.has(key) || !routePrefetchMap[key]) return;

  prefetched.add(key);
  routePrefetchMap[key]();
}

/** Routes to prefetch during browser idle time (most visited) */
const HIGH_PRIORITY_ROUTES = ["/car", "/favorites", "/sell", "/auth", "/messages"];

/**
 * Prefetch the most visited routes when the browser is idle.
 * Uses requestIdleCallback with a 3s timeout fallback.
 * Call once after the app has mounted and rendered.
 */
export function prefetchCriticalRoutes(): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => {
      HIGH_PRIORITY_ROUTES.forEach(prefetchRoute);
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      HIGH_PRIORITY_ROUTES.forEach(prefetchRoute);
    }, 3000);
  }
}
