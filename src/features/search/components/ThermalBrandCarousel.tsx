/**
 * ThermalBrandCarousel — horizontal scroll carousel of popular thermal brands
 * with locally-hosted brand logos (no CDN dependency).
 * @module features/search/components
 */
import { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThermalBrandCarouselProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

interface BrandEntry {
  name: string;
  logo: string;
}

const BRANDS: BrandEntry[] = [
  { name: "BMW",           logo: "/brands/bmw.svg"        },
  { name: "Mercedes-Benz", logo: "/brands/mercedes.svg"   },
  { name: "Audi",          logo: "/brands/audi.svg"       },
  { name: "Volkswagen",    logo: "/brands/volkswagen.svg" },
  { name: "Peugeot",       logo: "/brands/peugeot.svg"    },
  { name: "Renault",       logo: "/brands/renault.svg"    },
  { name: "Ford",          logo: "/brands/ford.svg"       },
  { name: "Opel",          logo: "/brands/opel.svg"       },
  { name: "Volvo",         logo: "/brands/volvo.svg"      },
  { name: "Porsche",       logo: "/brands/porsche.svg"    },
];

const ThermalBrandCarousel = memo(function ThermalBrandCarousel({
  onBrandFilter,
  selectedBrand,
}: ThermalBrandCarouselProps) {
  const { language } = useLanguage();

  const eyebrow =
    language === "nl" ? "Zoeken op populair merk"
    : language === "en" ? "Search by popular brand"
    : language === "de" ? "Nach Marke suchen"
    : "Rechercher par marque populaire";

  const handleClick = (name: string) => {
    if (onBrandFilter) onBrandFilter(selectedBrand === name ? "" : name);
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-background py-12 md:py-16 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-6 md:mb-8">
        <p className="text-[11px] md:text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      </div>

      <div
        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex gap-3 md:gap-4 px-6 md:px-12 pb-2">
          {BRANDS.map(({ name, logo }) => {
            const active = selectedBrand === name;
            return (
              <button
                key={name}
                onClick={() => handleClick(name)}
                aria-pressed={active}
                aria-label={name}
                className={[
                  "group flex-shrink-0 snap-start flex flex-col items-center justify-center gap-3",
                  "w-32 sm:w-36 h-28 sm:h-32 rounded-2xl border bg-card px-4",
                  "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                  active
                    ? "border-primary/60 shadow-md shadow-primary/10 bg-primary/5"
                    : "border-border/40 hover:border-primary/50",
                ].join(" ")}
              >
                <img
                  src={logo}
                  alt={name}
                  width={80}
                  height={44}
                  loading="lazy"
                  className={[
                    "w-16 sm:w-20 h-10 sm:h-11 object-contain",
                    "transition-all duration-300 group-hover:scale-110",
                    active
                      ? "opacity-100"
                      : "opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[10px] sm:text-[11px] font-medium tracking-wide text-center leading-tight",
                    "transition-colors duration-300 whitespace-nowrap",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  ].join(" ")}
                >
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default ThermalBrandCarousel;
