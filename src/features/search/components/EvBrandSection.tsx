/**
 * Marques 100% Électriques — homepage section harmonisée (fond sombre).
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
    <section className="bg-neutral-950 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="space-y-4 max-w-2xl mb-12">
          <p className="text-xs md:text-sm font-medium uppercase tracking-[0.15em] text-emerald-500">
            {eyebrow}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-tight text-white">
            {title}
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-neutral-400">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {PURE_EV_BRANDS.map((name) => {
            const active = selectedBrand === name;
            return (
              <button
                key={name}
                onClick={() => handleClick(name)}
                aria-pressed={active}
                className={cn(
                  "group relative h-28 md:h-32 rounded-2xl border bg-neutral-900 flex items-center justify-center",
                  "transition-all duration-300 hover:-translate-y-1",
                  active
                    ? "border-emerald-500/60 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                    : "border-neutral-800 hover:border-emerald-500/50",
                )}
              >
                <span
                  className={cn(
                    "font-serif text-lg md:text-xl font-medium tracking-wide transition-colors",
                    active ? "text-emerald-400" : "text-neutral-200 group-hover:text-white",
                  )}
                >
                  {name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-12">
          <Link
            to="/marques-electriques"
            className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-medium transition-colors group"
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
