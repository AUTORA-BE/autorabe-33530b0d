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
// Plausible loader — only injects the script AFTER analytics consent
// ============================================================================

const PLAUSIBLE_SRC =
  "https://plausible.io/js/script.manual.tagged-events.outbound-links.js";
const PLAUSIBLE_DOMAIN = "autora.be";
let plausibleLoaded = false;

function shouldSkipPlausible(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true; // iframe (lovable preview)
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host === "localhost") return true;
  if (host.endsWith(".lovable.app") && host.includes("preview")) return true;
  return false;
}

export function loadPlausibleIfAllowed(): void {
  if (plausibleLoaded) return;
  if (!analyticsAllowed()) return;
  if (shouldSkipPlausible()) {
    plausibleLoaded = true; // prevent retries
    return;
  }
  try {
    // queue stub so events called before script load are buffered
    const w = window as unknown as {
      plausible?: ((...args: unknown[]) => void) & { q?: unknown[] };
    };
    if (!w.plausible) {
      const stub = function (...args: unknown[]) {
        (stub.q = stub.q || []).push(args);
      } as ((...args: unknown[]) => void) & { q?: unknown[] };
      w.plausible = stub;
    }
    const script = document.createElement("script");
    script.defer = true;
    script.src = PLAUSIBLE_SRC;
    script.setAttribute("data-domain", PLAUSIBLE_DOMAIN);
    document.head.appendChild(script);
    plausibleLoaded = true;
  } catch {
    /* noop */
  }
}

// Auto-load on consent change
onConsentChange(() => loadPlausibleIfAllowed());
