/**
 * Floating "Need help?" button — opens the contact page.
 * Lightweight alternative to a third-party chat widget (no cookies, no CSP changes).
 * @module shared/components
 */

import { useNavigate, useLocation } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const labels: Record<string, string> = {
  fr: "Besoin d'aide ?",
  nl: "Hulp nodig?",
  de: "Brauchen Sie Hilfe?",
  en: "Need help?",
};

const HelpButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  // Hide on the contact page itself and admin/auth flows
  const hiddenRoutes = ["/contact", "/auth", "/admin", "/reset-password"];
  if (hiddenRoutes.some((r) => location.pathname.startsWith(r))) return null;

  const label = labels[language] ?? labels.fr;

  return (
    <button
      type="button"
      onClick={() => navigate("/contact")}
      aria-label={label}
      className="fixed z-40 bottom-24 left-4 md:bottom-6 md:left-6 inline-flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-md border border-border/40 text-foreground px-4 py-3 shadow-elevated hover:shadow-glow hover:border-primary/40 transition-all duration-200 hover:scale-105 active:scale-95"
    >
      <LifeBuoy className="w-4 h-4" aria-hidden="true" />
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </button>
  );
};

export default HelpButton;
