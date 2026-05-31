/**
 * ComplianceBanner — disclaimer discret affiché au-dessus des résultats
 * fournis par l'IA fiscale ou par tout autre conseil non-professionnel.
 *
 * Apparait sous forme de bandeau gris neutre, non-bloquant, lisible.
 * Couvre l'item C8 de l'audit pré-launch (AI fiscal sans disclaimer).
 *
 * @module components/ComplianceBanner
 */

import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const messages = {
  fr: "Estimation indicative. Ceci ne constitue pas un conseil fiscal ou juridique professionnel. AutoRa ne peut être tenu responsable des décisions prises sur cette base.",
  nl: "Indicatieve schatting. Dit vormt geen professioneel fiscaal of juridisch advies. AutoRa kan niet aansprakelijk worden gesteld voor beslissingen die op deze basis worden genomen.",
  de: "Unverbindliche Schätzung. Dies stellt keine professionelle Steuer- oder Rechtsberatung dar. AutoRa haftet nicht für auf dieser Grundlage getroffene Entscheidungen.",
  en: "Indicative estimate. This does not constitute professional tax or legal advice. AutoRa cannot be held liable for decisions made on this basis.",
};

type Lang = keyof typeof messages;

interface ComplianceBannerProps {
  /** Override the auto-detected language from the LanguageContext */
  lang?: Lang;
  /** Optional extra Tailwind classes */
  className?: string;
}

export default function ComplianceBanner({ lang, className = "" }: ComplianceBannerProps) {
  const { language } = useLanguage();
  const resolvedLang: Lang = lang ?? ((["fr", "nl", "de", "en"] as const).includes(language as Lang)
    ? (language as Lang)
    : "fr");

  return (
    <div
      role="note"
      aria-label="Compliance disclaimer"
      className={`flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/20 rounded-md px-3 py-2 ${className}`}
    >
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" aria-hidden="true" />
      <span className="leading-relaxed">{messages[resolvedLang]}</span>
    </div>
  );
}
