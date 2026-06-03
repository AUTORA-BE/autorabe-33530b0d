/**
 * ThermalBrandCarousel — popular brand logos.
 * - Mobile: infinite marquee (auto-scroll).
 * - Desktop: Embla carousel with autoplay loop + visible prev/next arrows.
 *
 * Logo files (PNG, transparent background) must be placed at:
 *   /public/logos/{slug}.png
 * @module features/search/components
 */
import { memo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThermalBrandCarouselProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

interface BrandEntry {
  name: string;
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
  { name: "Citroën",        logo: "/logos/citroen.png" },
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
  const [api, setApi] = useState<CarouselApi>();

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
      <div className="max-w-7xl mx-auto px-5 md:px-12 mb-6 md:mb-8">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
          {eyebrow}
        </p>
      </div>

      {/* Mobile : Infinite Marquee (auto-scroll, touch-friendly) */}
      <div
        className="md:hidden overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        <div className="flex w-max animate-marquee-x">
          {[...BRANDS, ...BRANDS].map((entry, idx) => {
            const filterValue = entry.filterBrand ?? entry.name;
            const active = selectedBrand === filterValue;
            return (
              <button
                key={`${entry.name}-${idx}`}
                onClick={() => handleClick(entry)}
                aria-pressed={active}
                aria-label={entry.name}
                aria-hidden={idx >= BRANDS.length}
                tabIndex={idx >= BRANDS.length ? -1 : 0}
                className="shrink-0 flex items-center justify-center w-24 h-16 px-2 rounded-none bg-transparent border-0 transition-opacity active:opacity-60"
              >
                <img
                  src={entry.logo}
                  alt={`Logo ${entry.name}`}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  className={[
                    "h-10 w-auto max-w-full object-contain",
                    active ? "opacity-100" : "opacity-90",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop : Embla carousel — autoplay loop + arrows + drag */}
      <div className="hidden md:block max-w-7xl mx-auto px-5 md:px-12">
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, dragFree: true }}
            plugins={[
              Autoplay({ delay: 2800, stopOnInteraction: false, stopOnMouseEnter: true }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {BRANDS.map((entry) => {
                const filterValue = entry.filterBrand ?? entry.name;
                const active = selectedBrand === filterValue;
                return (
                  <CarouselItem
                    key={entry.name}
                    className="pl-3 basis-1/4 lg:basis-1/5 xl:basis-1/6"
                  >
                    <button
                      onClick={() => handleClick(entry)}
                      aria-pressed={active}
                      aria-label={entry.name}
                      className={[
                        "group w-full flex flex-col items-center justify-center gap-3",
                        "h-28 sm:h-32 rounded-2xl border bg-card px-4",
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
                          "text-[11px] font-medium tracking-wide text-center leading-tight",
                          "transition-colors duration-300 whitespace-nowrap",
                          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                        ].join(" ")}
                      >
                        {entry.name}
                      </span>
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Functional arrows — glass effect, visible on light & dark */}
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all shadow-sm z-10"
            aria-label="Marques précédentes"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all shadow-sm z-10"
            aria-label="Marques suivantes"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
});

export default ThermalBrandCarousel;
