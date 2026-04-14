/**
 * PWA Install prompt banner — shown on mobile when app is installable
 * Supports Android (beforeinstallprompt) and iOS (manual instructions)
 * @module components
 */

import { useState, useEffect, useCallback } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "autora_pwa_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as Record<string, boolean>).standalone === true
  );
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION) return;

    if (isIOS()) {
      const timer = setTimeout(() => {
        setIosMode(true);
        setShow(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }, []);

  if (!show) return null;

  return (
    <div
      className="md:hidden fixed bottom-20 left-3 right-3 z-[80] rounded-2xl bg-card/95 backdrop-blur-xl border border-border/30 p-4 shadow-xl safe-bottom animate-in slide-in-from-bottom-8 duration-300"
      role="alert"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground touch-manipulation"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          {iosMode ? (
            <Share className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Download className="w-5 h-5 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            Installer AutoRa
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {iosMode
              ? "Appuyez sur Partager puis « Sur l'écran d'accueil »"
              : "Accès rapide depuis votre écran d'accueil"}
          </p>
        </div>
        {!iosMode && (
          <button
            onClick={handleInstall}
            className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/20 active:scale-[0.95] transition-transform flex-shrink-0 min-h-[44px] touch-manipulation"
          >
            Installer
          </button>
        )}
      </div>
    </div>
  );
}
