/**
 * Marques 100% Électriques — homepage section, theme-adaptive.
 * Light mode: bg-white + slate-900 text. Dark mode: bg-slate-950 + white text.
 * Visually continuous with the rest of the home page in both themes.
 * @module features/search/components
 */
import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface EvBrandSectionProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

const PURE_EV_BRANDS = [
  "Tesla", "Polestar", "Rivian", "Lucid", "BYD", "NIO", "XPENG", "Fisker",
] as const;

const EvBrandSection = memo(function EvBrandSection({
  onBrandFilter,
  selectedBrand,
}: EvBrandSectionProps) {
  const { language } = useLanguage();

  const eyebrow =
    language === "nl" ? "Pure elektrische merken"
    : language === "en" ? "Pure electric brands"
    : language === "de" ? "Reine Elektromarken"
    : "Pure player électrique";

  const title =
    language === "nl" ? "Merken 100% Elektrisch"
    : language === "en" ? "100% Electric Brands"
    : language === "de" ? "100 % Elektromarken"
    : "Marques 100% Électriques";

  const subtitle =
    language === "nl" ? "Constructeurs waarvan de hele gamma elektrisch is — al beschikbaar op AutoRA."
    : language === "en" ? "Manufacturers whose entire lineup is electric — already available on AutoRA."
    : language === "de" ? "Hersteller mit vollständig elektrischem Sortiment — schon auf AutoRA verfügbar."
    : "Constructeurs dont toute la gamme est électrique — déjà disponibles sur AutoRA.";

  const cta =
    language === "nl" ? "Ontdek alle merken met EV-aanbod"
    : language === "en" ? "Discover all brands with an EV lineup"
    : language === "de" ? "Alle Marken mit EV-Modellen entdecken"
    : "Découvrir toutes les marques avec gamme électrique";

  const handleClick = (brand: string) => {
    if (onBrandFilter) onBrandFilter(selectedBrand === brand ? "" : brand);
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-white dark:bg-slate-950 py-10 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-12">
        <div className="space-y-3 md:space-y-4 max-w-2xl mb-8 md:mb-12">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
            {eyebrow}
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light leading-[1.15] md:leading-[1.1] tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-[13.5px] sm:text-base font-light leading-relaxed text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        </div>

        {/* Mobile = grille stricte 4 colonnes, carrés parfaits · Desktop = grille 4-col existante */}
        <div
          className={cn(
            "grid grid-cols-4 md:grid-cols-4",
            "gap-3 md:gap-6",
          )}
        >
          {PURE_EV_BRANDS.map((name) => {
            const active = selectedBrand === name;
            return (
              <button
                key={name}
                onClick={() => handleClick(name)}
                aria-pressed={active}
                className={cn(
                  "group relative rounded-2xl border flex items-center justify-center",
                  "aspect-square md:aspect-auto md:h-32",
                  "bg-white dark:bg-white/[0.02]",
                  "transition-all duration-300 ease-out shadow-sm dark:shadow-black/30",
                  "active:scale-[0.94] md:active:scale-100",
                  "md:hover:scale-[1.02] md:hover:shadow-md dark:md:hover:shadow-primary/10 md:hover:border-primary",
                  active
                    ? "border-primary shadow-md ring-1 ring-primary/20"
                    : "border-slate-200 dark:border-white/5",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] md:text-lg font-medium tracking-tight transition-colors text-center px-1 leading-tight",
                    active
                      ? "text-primary"
                      : "text-slate-900 dark:text-white md:group-hover:text-primary",
                  )}
                >
                  {name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 md:mt-12">
          <Link
            to="/marques-electriques"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group text-sm md:text-base"
          >
            <span>{cta}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </section>
  );
});

export default EvBrandSection;
