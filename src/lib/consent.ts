/**
 * RGPD Consent Manager
 * - Single source of truth for cookie consent state
 * - Gates analytics scripts BEFORE they are injected (real RGPD compliance)
 * - Pub/sub so UI components react to consent changes
 */

const STORAGE_KEY = "autora_cookie_consent";

export interface ConsentState {
  essential: true; // always required for the site to work
  analytics: boolean;
  consented: boolean; // user has made an explicit choice
  timestamp: number;
}

const DEFAULT_STATE: ConsentState = {
  essential: true,
  analytics: false,
  consented: false,
  timestamp: 0,
};

type Listener = (state: ConsentState) => void;
const listeners = new Set<Listener>();

function read(): ConsentState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      consented: Boolean(parsed.consented),
      timestamp: Number(parsed.timestamp) || 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

let current: ConsentState = read();

export function getConsent(): ConsentState {
  return current;
}

export function hasConsented(): boolean {
  return current.consented;
}

export function analyticsAllowed(): boolean {
  return current.consented && current.analytics;
}

function persistAndNotify(next: ConsentState) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable */
  }
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch {
      /* listener error swallowed */
    }
  });
}

export function setConsent(analytics: boolean): void {
  persistAndNotify({
    essential: true,
    analytics,
    consented: true,
    timestamp: Date.now(),
  });
}

/** Reset consent (used by "manage cookies" button on the privacy page). */
export function resetConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  current = { ...DEFAULT_STATE };
  listeners.forEach((fn) => fn(current));
}

export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ============================================================================
// Analytics loader — NO-OP.
// ----------------------------------------------------------------------------
// AutoRA migrated from Plausible to Cloudflare Web Analytics, which is
// cookieless and loaded at the edge / via a single beacon in index.html.
// There is therefore no client-side script to inject anymore.
//
// `loadPlausibleIfAllowed` is intentionally kept (as a no-op) so that its two
// call sites — main.tsx boot + onConsentChange — keep working untouched.
// The legacy `trackEvent()` calls scattered across the app also keep working:
// analytics.ts guards them with `window.plausible?.(…)`, which is a harmless
// no-op now that `window.plausible` is never defined.
// ============================================================================

export function loadPlausibleIfAllowed(): void {
  /* no-op — Cloudflare Web Analytics needs no client-side loader */
}
