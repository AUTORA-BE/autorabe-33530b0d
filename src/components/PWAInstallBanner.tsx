/**
 * PWA Install prompt banner — shown on mobile when app is installable
 * @module components
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "autora_pwa_dismissed";

export default function PWAInstallBanner() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay for better UX
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-20 left-3 right-3 z-[80] rounded-[20px] bg-card/90 backdrop-blur-2xl border border-border/30 p-4 shadow-xl shadow-foreground/[0.05] safe-bottom"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                Installer AutoRa
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accès rapide depuis votre écran d'accueil
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/20 active:scale-[0.95] transition-transform flex-shrink-0"
            >
              Installer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
