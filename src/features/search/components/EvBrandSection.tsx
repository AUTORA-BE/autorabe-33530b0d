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
    <section className="bg-[#0A1118] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="space-y-4 max-w-2xl mb-12">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
            {eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight text-white">
            {title}
          </h2>
          <p className="text-sm sm:text-base font-light leading-relaxed text-white/65">
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
                  "group relative h-28 md:h-32 rounded-2xl border flex items-center justify-center",
                  "transition-all duration-300 hover:-translate-y-1",
                  active
                    ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-white/10 bg-white/[0.03] hover:border-primary/40 hover:bg-white/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "text-base md:text-lg font-medium tracking-tight transition-colors",
                    active ? "text-primary" : "text-white group-hover:text-primary",
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
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
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
