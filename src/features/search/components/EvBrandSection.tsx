/**
 * Marques 100% Électriques — homepage section
 * Affiche UNIQUEMENT les marques dont toute la gamme est EV.
 * Lien vers /marques-electriques pour la liste complète (constructeurs avec gamme EV).
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

// Constructeurs dont 100 % de la gamme est électrique
const PURE_EV_BRANDS = [
  "Tesla",
  "Polestar",
  "Rivian",
  "Lucid",
  "BYD",
  "NIO",
  "XPENG",
  "Fisker",
] as const;

const EvBrandSection = memo(function EvBrandSection({
  onBrandFilter,
  selectedBrand,
}: EvBrandSectionProps) {
  const { language } = useLanguage();

  const title =
    language === "nl" ? "Merken 100% Elektrisch"
    : language === "en" ? "100% Electric Brands"
    : language === "de" ? "100 % Elektromarken"
    : "Marques 100% Électriques";

  const cta =
    language === "nl" ? "Ontdek alle merken met EV-aanbod"
    : language === "en" ? "Discover all brands with an EV lineup"
    : language === "de" ? "Alle Marken mit EV-Modellen entdecken"
    : "Découvrir toutes les marques avec gamme électrique";

  const handleClick = (brand: string) => {
    if (onBrandFilter) {
      onBrandFilter(selectedBrand === brand ? "" : brand);
    }
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-6 sm:px-8 py-14 sm:py-20">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <h3 className="font-serif text-2xl sm:text-3xl font-light text-foreground tracking-tight">
          {title}
        </h3>
      </div>

      {/* Wordmark grid — typographie premium, fond sombre, hover lumineux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {PURE_EV_BRANDS.map((name) => {
          const active = selectedBrand === name;
          return (
            <button
              key={name}
              onClick={() => handleClick(name)}
              aria-pressed={active}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card/40 backdrop-blur-sm",
                "h-24 sm:h-28 flex items-center justify-center",
                "transition-all duration-300 active:scale-[0.97] hover:-translate-y-0.5",
                active
                  ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-border/50 hover:border-primary/40 hover:bg-card/70 hover:shadow-md"
              )}
            >
              {/* Subtle gradient sheen on hover */}
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
              />
              <span
                className={cn(
                  "relative font-serif text-lg sm:text-xl font-medium tracking-wide transition-colors duration-300",
                  active ? "text-primary" : "text-foreground/90 group-hover:text-foreground"
                )}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA → page dédiée */}
      <div className="mt-10 flex justify-center sm:justify-start">
        <Link
          to="/marques-electriques"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border/60 text-sm font-light text-foreground/80 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all duration-300 group"
        >
          <span>{cta}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
});

export default EvBrandSection;
