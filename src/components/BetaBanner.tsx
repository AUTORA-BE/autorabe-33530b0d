/**
 * BetaBanner — bandeau persistant en haut du site, indiquant que AutoRa
 * est en phase bêta pré-lancement (sans paiements activés).
 *
 * - Dismissible : l'utilisateur peut fermer via la croix. Le choix est
 *   persisté en localStorage pour ne pas re-afficher à chaque page.
 * - Multilingue auto via LanguageContext.
 * - Discret mais visible : couleur ambrée distinctive, non-intrusif.
 *
 * @module components/BetaBanner
 */

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "autora_beta_banner_dismissed_v1";

const messages = {
  fr: {
    text: "Phase bêta — l'inscription est gratuite, aucun paiement n'est traité. Vos retours nous aident à améliorer AutoRa avant le lancement officiel.",
    close: "Fermer cette annonce",
  },
  nl: {
    text: "Bèta-fase — registratie is gratis, geen betalingen worden verwerkt. Uw feedback helpt ons AutoRa te verbeteren vóór de officiële lancering.",
    close: "Sluit deze melding",
  },
  de: {
    text: "Beta-Phase — Registrierung ist kostenlos, keine Zahlungen werden bearbeitet. Ihr Feedback hilft uns, AutoRa vor dem offiziellen Start zu verbessern.",
    close: "Diese Meldung schließen",
  },
  en: {
    text: "Beta phase — sign-up is free, no payments are processed. Your feedback helps us improve AutoRa before the official launch.",
    close: "Dismiss this notice",
  },
};

type Lang = keyof typeof messages;

export default function BetaBanner() {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash on SSR-less hydration

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "true");
    } catch {
      // localStorage may be blocked (private mode, etc.) — show banner
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // best-effort persist; ignore
    }
  };

  if (dismissed) return null;

  const lang: Lang = (["fr", "nl", "de", "en"] as const).includes(language as Lang)
    ? (language as Lang)
    : "fr";
  const m = messages[lang];

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-500/10 border-b border-amber-600/30 text-amber-800 dark:text-amber-300"
    >
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <Sparkles className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
        <p className="text-xs sm:text-sm flex-1 leading-relaxed">{m.text}</p>
        <button
          onClick={handleDismiss}
          aria-label={m.close}
          className="p-1 -mr-1 rounded hover:bg-amber-500/20 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
