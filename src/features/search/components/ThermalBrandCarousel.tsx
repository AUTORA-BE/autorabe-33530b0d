/**
 * ThermalBrandCarousel — horizontal scroll carousel of popular brands
 * with real brand logos served from /public/logos/.
 *
 * Logo files (PNG, transparent background) must be placed at:
 *   /public/logos/{slug}.png
 * Slugs are listed below per brand.
 * @module features/search/components
 */
import { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThermalBrandCarouselProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

interface BrandEntry {
  /** Display name shown to user */
  name: string;
  /** Path to logo PNG (transparent background) */
  logo: string;
  /** Optional override for the brand filter value when display name differs from DB brand (e.g., "Range Rover" → "Land Rover") */
  filterBrand?: string;
}

const BRANDS: BrandEntry[] = [
  { name: "BMW",            logo: "/logos/bmw.png" },
  { name: "Mercedes-Benz",  logo: "/logos/mercedes-benz.png" },
  { name: "Audi",           logo: "/logos/audi.png" },
  { name: "Volkswagen",     logo: "/logos/volkswagen.png" },
  { name: "Peugeot",        logo: "/logos/peugeot.png" },
  { name: "Renault",        logo: "/logos/renault.png" },
  { name: "Ford",           logo: "/logos/ford.png" },
  { name: "Opel",           logo: "/logos/opel.png" },
  { name: "Fiat",           logo: "/logos/fiat.png" },
  { name: "Range Rover",    logo: "/logos/range-rover.png", filterBrand: "Land Rover" },
  { name: "Toyota",         logo: "/logos/toyota.png" },
  { name: "Skoda",          logo: "/logos/skoda.png" },
  { name: "Dacia",          logo: "/logos/dacia.png" },
  { name: "Jaguar",         logo: "/logos/jaguar.png" },
  { name: "Jeep",           logo: "/logos/jeep.png" },
  { name: "Hyundai",        logo: "/logos/hyundai.png" },
  { name: "Mini",           logo: "/logos/mini.png" },
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

  const handleClick = (entry: BrandEntry) => {
    const filterValue = entry.filterBrand ?? entry.name;
    if (onBrandFilter) onBrandFilter(selectedBrand === filterValue ? "" : filterValue);
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
          {BRANDS.map((entry) => {
            const filterValue = entry.filterBrand ?? entry.name;
            const active = selectedBrand === filterValue;
            return (
              <button
                key={entry.name}
                onClick={() => handleClick(entry)}
                aria-pressed={active}
                aria-label={entry.name}
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
                  src={entry.logo}
                  alt={`Logo ${entry.name}`}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  className={[
                    "h-12 w-auto max-w-[85%] object-contain",
                    "transition-all duration-300 group-hover:scale-110",
                    active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[10px] sm:text-[11px] font-medium tracking-wide text-center leading-tight",
                    "transition-colors duration-300 whitespace-nowrap",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  ].join(" ")}
                >
                  {entry.name}
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
