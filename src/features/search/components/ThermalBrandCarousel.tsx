/**
 * ThermalBrandCarousel — horizontal scroll carousel of popular thermal brands
 * in Belgium with real official brand logos. Excludes pure-EV brands.
 * @module features/search/components
 */
import { memo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThermalBrandCarouselProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

interface BrandEntry {
  name: string;
  /** simpleicons.org slug (CDN serves SVG in original brand color) */
  slug: string;
}

const BRANDS: BrandEntry[] = [
  { name: "BMW", slug: "bmw" },
  { name: "Mercedes-Benz", slug: "mercedes" },
  { name: "Audi", slug: "audi" },
  { name: "Volkswagen", slug: "volkswagen" },
  { name: "Peugeot", slug: "peugeot" },
  { name: "Renault", slug: "renault" },
  { name: "Ford", slug: "ford" },
  { name: "Opel", slug: "opel" },
  { name: "Volvo", slug: "volvo" },
  { name: "Porsche", slug: "porsche" },
];

interface BrandCardProps {
  brand: BrandEntry;
  active: boolean;
  onClick: (name: string) => void;
}

function BrandCard({ brand, active, onClick }: BrandCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(brand.name)}
      aria-pressed={active}
      aria-label={brand.name}
      className={[
        "group flex-shrink-0 snap-start w-32 sm:w-36 h-24 sm:h-28",
        "flex items-center justify-center rounded-2xl border bg-card",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        active
          ? "border-primary/60 shadow-md shadow-primary/10"
          : "border-border/40 hover:border-primary/50",
      ].join(" ")}
    >
      {!imgError ? (
        <img
          src={`https://cdn.simpleicons.org/${brand.slug}`}
          alt={brand.name}
          loading="lazy"
          width={64}
          height={36}
          onError={() => setImgError(true)}
          className={[
            "h-8 sm:h-9 w-auto max-w-[78%] object-contain",
            "transition-all duration-300 group-hover:scale-110",
            active
              ? "grayscale-0 opacity-100"
              : "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100",
          ].join(" ")}
        />
      ) : (
        <span
          className={[
            "font-serif text-sm sm:text-base font-medium tracking-wide",
            "transition-colors duration-300",
            active ? "text-primary" : "text-foreground/60 group-hover:text-primary",
          ].join(" ")}
        >
          {brand.name}
        </span>
      )}
    </button>
  );
}

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

  const handleClick = (brand: string) => {
    if (onBrandFilter) onBrandFilter(selectedBrand === brand ? "" : brand);
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
          {BRANDS.map((brand) => (
            <BrandCard
              key={brand.slug}
              brand={brand}
              active={selectedBrand === brand.name}
              onClick={handleClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export default ThermalBrandCarousel;
