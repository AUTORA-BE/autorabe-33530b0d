/**
 * RGPD-compliant cookie consent banner
 * @module components/CookieBanner
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_KEY = "autora_cookie_consent";

interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  consented: boolean;
  timestamp: number;
}

/**
 * Discreet bottom banner for cookie consent (RGPD)
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (!stored) {
        // Small delay so the page loads first
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleAccept = () => {
    const consent: CookieConsent = {
      essential: true,
      analytics: true,
      consented: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const handleRefuse = () => {
    const consent: CookieConsent = {
      essential: true,
      analytics: false,
      consented: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const texts = {
    fr: {
      message: "Nous utilisons des cookies essentiels pour le fonctionnement du site. Acceptez-vous également les cookies analytiques pour nous aider à améliorer votre expérience ?",
      accept: "Accepter",
      refuse: "Refuser",
      privacy: "Politique de confidentialité",
    },
    nl: {
      message: "Wij gebruiken essentiële cookies voor de werking van de site. Accepteert u ook analytische cookies om uw ervaring te verbeteren?",
      accept: "Accepteren",
      refuse: "Weigeren",
      privacy: "Privacybeleid",
    },
    de: {
      message: "Wir verwenden wesentliche Cookies für den Betrieb der Website. Akzeptieren Sie auch analytische Cookies?",
      accept: "Akzeptieren",
      refuse: "Ablehnen",
      privacy: "Datenschutz",
    },
    en: {
      message: "We use essential cookies for the site to function. Do you also accept analytics cookies to help us improve your experience?",
      accept: "Accept",
      refuse: "Decline",
      privacy: "Privacy Policy",
    },
  };

  const t = texts[language] || texts.fr;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[var(--z-toast)] safe-bottom"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  {t.message}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={handleAccept} className="text-xs">
                    {t.accept}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRefuse} className="text-xs">
                    {t.refuse}
                  </Button>
                  <a
                    href="/privacy"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
                  >
                    {t.privacy}
                  </a>
                </div>
              </div>
              <button
                onClick={handleRefuse}
                className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center shrink-0 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
