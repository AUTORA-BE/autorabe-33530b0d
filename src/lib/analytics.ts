/**
 * Plausible Analytics wrapper
 * - No-op in dev / preview / iframe to keep dashboards clean
 * - Custom props (user_id, role, email) auto-injected on every event
 * - Safe before plausible script has loaded (uses window queue)
 */

type Props = Record<string, string | number | boolean | undefined | null>;

interface UserContext {
  user_id?: string;
  role?: string;
  email?: string;
}

let userCtx: UserContext = {};

const isBrowser = typeof window !== "undefined";

/** Skip tracking in preview / iframe / dev to avoid polluting production stats. */
function isTrackingDisabled(): boolean {
  if (!isBrowser) return true;
  try {
    if (window.self !== window.top) return true; // iframe (lovable preview)
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host === "localhost" || host.endsWith(".lovable.app") && host.includes("preview")) {
    return true;
  }
  return false;
}

declare global {
  interface Window {
    plausible?: ((event: string, opts?: { props?: Props; callback?: () => void }) => void) & {
      q?: unknown[];
    };
  }
}

/**
 * Track a custom event. Props are merged with current user context.
 * Use snake_case event names to match the Plausible dashboard convention.
 */
export function trackEvent(name: string, props: Props = {}): void {
  if (isTrackingDisabled()) return;
  try {
    const merged: Props = { ...userCtx, ...props };
    // Strip undefined/null
    const clean: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== null && v !== "") clean[k] = v;
    }
    window.plausible?.(name, { props: clean });
  } catch {
    /* never throw from analytics */
  }
}

/** Identify the current user — props are attached to all subsequent events. */
export function identifyUser(ctx: UserContext): void {
  userCtx = { ...userCtx, ...ctx };
}

/** Reset on logout. */
export function resetUser(): void {
  userCtx = {};
}

/** Manually trigger a pageview (auto-tracking is enabled but SPA route changes need this). */
export function trackPageview(url?: string): void {
  if (isTrackingDisabled()) return;
  try {
    window.plausible?.("pageview", url ? { props: { url } } : undefined);
  } catch {
    /* noop */
  }
}

/** Standard event names — single source of truth. */
export const EVENTS = {
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_COMPLETED: "login_completed",
  LOGOUT: "logout",
  SEARCH_PERFORMED: "search_performed",
  VEHICLE_VIEWED: "vehicle_viewed",
  FAVORITE_ADDED: "favorite_added",
  CONTACT_SELLER_CLICKED: "contact_seller_clicked",
  MESSAGE_SENT: "message_sent",
  LISTING_STARTED: "listing_started",
  LISTING_PUBLISHED: "listing_published",
  BOOST_PURCHASED: "boost_purchased",
} as const;
