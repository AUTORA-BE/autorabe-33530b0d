/**
 * ThermalBrandCarousel — auto-scrolling marquee of popular thermal/traditional brands in Belgium.
 * Excludes pure-EV brands (Tesla, BYD, etc.).
 * @module features/search/components
 */
import { memo } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThermalBrandCarouselProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

const THERMAL_BRANDS = [
  "Volkswagen",
  "Peugeot",
  "Renault",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Ford",
  "Opel",
  "Citroën",
  "Fiat",
] as const;

// Doubled for seamless infinite loop
const BRANDS_LOOP = [...THERMAL_BRANDS, ...THERMAL_BRANDS];

const ThermalBrandCarousel = memo(function ThermalBrandCarousel({
  onBrandFilter,
  selectedBrand,
}: ThermalBrandCarouselProps) {
  const { language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  const eyebrow =
    language === "nl" ? "Zoeken op populair merk"
    : language === "en" ? "Search by popular brand"
    : language === "de" ? "Nach Marke suchen"
    : "Rechercher par marque populaire";

  const handleClick = (brand: string) => {
    if (onBrandFilter) onBrandFilter(selectedBrand === brand ? "" : brand);
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-background py-12 md:py-16 border-t border-border/30">
      {/* Eyebrow label */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
        <p className="text-[11px] md:text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      </div>

      {/* Marquee container — overflow hidden hides the seam */}
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <motion.div
          className="flex gap-3 md:gap-4 w-max"
          animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
          whileHover={prefersReducedMotion ? undefined : { animationPlayState: "paused" }}
          style={prefersReducedMotion ? undefined : undefined}
        >
          {BRANDS_LOOP.map((brand, i) => {
            const active = selectedBrand === brand;
            return (
              <button
                key={`${brand}-${i}`}
                onClick={() => handleClick(brand)}
                aria-pressed={active}
                className={[
                  "flex-shrink-0 h-16 md:h-20 px-7 md:px-9 rounded-2xl border",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                  active
                    ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border/40 bg-card hover:border-primary/40 hover:bg-card/80",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-serif text-sm md:text-base font-medium tracking-wide whitespace-nowrap transition-colors duration-300",
                    active ? "text-primary" : "text-foreground/80 hover:text-primary",
                  ].join(" ")}
                >
                  {brand}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
});

export default ThermalBrandCarousel;
