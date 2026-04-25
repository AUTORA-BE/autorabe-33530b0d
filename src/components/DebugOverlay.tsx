/**
 * DebugOverlay — outils de debug visuels pour vérifier breakpoints,
 * état du FilterPanel et absence de double-mount.
 *
 * Activation (jamais visible par défaut) :
 *  - URL : ?debug=1
 *  - localStorage.setItem('autora:debug', '1')
 *  - Raccourci : Ctrl+Shift+D (toggle + persist)
 */

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "autora:debug";

export function useDebugMode(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "1") return true;
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const update = useCallback((v: boolean) => {
    setEnabled(v);
    try {
      if (v) window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        update(!enabled);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, update]);

  return [enabled, update];
}

interface DebugOverlayProps {
  filtersOpen: boolean;
  isDesktopFiltersViewport: boolean;
}

export function DebugOverlay({ filtersOpen, isDesktopFiltersViewport }: DebugOverlayProps) {
  const [enabled, setEnabled] = useDebugMode();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [panelCount, setPanelCount] = useState(0);
  const [variants, setVariants] = useState<string[]>([]);
  const [bodyLocked, setBodyLocked] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState("0px");

  useEffect(() => {
    if (!enabled) return;
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      const nodes = document.querySelectorAll<HTMLElement>("[data-filter-panel-root]");
      setPanelCount(nodes.length);
      setVariants(
        Array.from(nodes).map((n) => {
          const wrapper = n.closest<HTMLElement>("[data-filter-variant]");
          const variant = wrapper?.getAttribute("data-filter-variant") || "?";
          const open = n.getAttribute("data-filter-open") === "true" ? ":open" : "";
          return variant + open;
        }),
      );
      setBodyLocked(document.body.style.overflow === "hidden");
      const probe = getComputedStyle(document.documentElement).getPropertyValue("--safe-area-top").trim();
      setSafeAreaTop(probe || "0px");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled) return null;

  const bp =
    size.w >= 1280 ? "xl (≥1280)" : size.w >= 1024 ? "lg (≥1024)" : size.w >= 768 ? "md (≥768)" : "sm (<768)";
  const expectedVariant = isDesktopFiltersViewport ? "desktop" : "mobile";
  const countOk = panelCount === 1;

  return (
    <div
      className="fixed left-2 bottom-20 z-[200] pointer-events-auto select-none rounded-lg border border-white/15 bg-black/85 px-3 py-2 text-[11px] font-mono leading-tight text-white shadow-2xl backdrop-blur"
      style={{ maxWidth: 280 }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-bold text-emerald-400">DEBUG</span>
        <button
          onClick={() => setEnabled(false)}
          className="text-white/60 hover:text-white text-[10px] uppercase tracking-wider"
          aria-label="Fermer le debug"
        >
          off
        </button>
      </div>
      <div>viewport: {size.w} × {size.h}</div>
      <div>breakpoint: {bp}</div>
      <div>
        lg+ ≥1024: <span className={isDesktopFiltersViewport ? "text-emerald-400" : "text-amber-400"}>
          {String(isDesktopFiltersViewport)}
        </span>
        {" → "}
        {expectedVariant} mounted
      </div>
      <div>
        filtersOpen:{" "}
        <span className={filtersOpen ? "text-emerald-400" : "text-white/60"}>{String(filtersOpen)}</span>
      </div>
      <div>
        FilterPanel in DOM:{" "}
        <span className={countOk ? "text-emerald-400" : "text-red-400"}>
          {panelCount} {countOk ? "✓" : "✗ DOUBLE-MOUNT"}
        </span>
      </div>
      {variants.length > 0 && (
        <div className="text-white/60">variants: [{variants.join(", ")}]</div>
      )}
      <div>
        body lock:{" "}
        <span className={bodyLocked ? "text-emerald-400" : "text-white/60"}>{bodyLocked ? "on" : "off"}</span>
      </div>
      <div className="text-white/50">safe-area-top: {safeAreaTop}</div>
      <div className="mt-1 text-[10px] text-white/40">Ctrl+Shift+D</div>
    </div>
  );
}

export default DebugOverlay;
