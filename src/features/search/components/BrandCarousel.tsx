/**
 * BrandCarousel component - auto-playing carousel of brand logos
 * @module features/search/components
 */

import { useState, useEffect, useCallback, memo } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Import official brand logos
import volkswagenLogo from "@/assets/brands/volkswagen.png";
import bmwLogo from "@/assets/brands/bmw.png";
import audiLogo from "@/assets/brands/audi.png";
import mercedesLogo from "@/assets/brands/mercedes.png";
import peugeotLogo from "@/assets/brands/peugeot.png";
import renaultLogo from "@/assets/brands/renault.png";
import citroenLogo from "@/assets/brands/citroen.png";
import toyotaLogo from "@/assets/brands/toyota.png";
import fordLogo from "@/assets/brands/ford.png";
import opelLogo from "@/assets/brands/opel.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";
import kiaLogo from "@/assets/brands/kia.png";
import fiatLogo from "@/assets/brands/fiat.png";
import volvoLogo from "@/assets/brands/volvo.png";
import skodaLogo from "@/assets/brands/skoda.png";

import type { BrandConfig } from "../types/search.types";

const BRANDS: BrandConfig[] = [
  { name: "Volkswagen", logo: volkswagenLogo, color: "#001E50" },
  { name: "BMW", logo: bmwLogo, color: "#0066B1" },
  { name: "Audi", logo: audiLogo, color: "#000000" },
  { name: "Mercedes-Benz", logo: mercedesLogo, color: "#000000" },
  { name: "Peugeot", logo: peugeotLogo, color: "#000000" },
  { name: "Renault", logo: renaultLogo, color: "#000000" },
  { name: "Citroën", logo: citroenLogo, color: "#AC1521" },
  { name: "Toyota", logo: toyotaLogo, color: "#EB0A1E" },
  { name: "Ford", logo: fordLogo, color: "#003478" },
  { name: "Opel", logo: opelLogo, color: "#FFD700" },
  { name: "Hyundai", logo: hyundaiLogo, color: "#002C5F" },
  { name: "Kia", logo: kiaLogo, color: "#05141F" },
  { name: "Fiat", logo: fiatLogo, color: "#8B0000" },
  { name: "Volvo", logo: volvoLogo, color: "#003057" },
  { name: "Škoda", logo: skodaLogo, color: "#4BA82E" },
];

export interface BrandCarouselProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

const BrandCarousel = memo(function BrandCarousel({ 
  onBrandFilter, 
  selectedBrand 
}: BrandCarouselProps) {
  const { t } = useLanguage();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    // Defer layout-triggering reads to avoid forced reflow during render
    requestAnimationFrame(() => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    });
    const onSelect = () => {
      requestAnimationFrame(() => {
        setCurrent(api.selectedScrollSnap());
      });
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  const handleBrandClick = (brandName: string) => {
    if (onBrandFilter) {
      onBrandFilter(selectedBrand === brandName ? "" : brandName);
    }
    const resultsSection = document.getElementById("results-section");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      className="py-6 sm:py-10 bg-gradient-to-b from-muted/30 to-background"
      aria-labelledby="brands-title"
      style={{ contain: "layout style" }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <h2 
          id="brands-title"
          className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-center mb-5 sm:mb-8 text-foreground"
        >
          {t("brands.title")}
        </h2>
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 2500,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full max-w-6xl mx-auto px-10 md:px-14"
        >
          <CarouselContent className="-ml-3 sm:-ml-4 overflow-visible">
            {BRANDS.map((brand) => (
              <CarouselItem
                key={brand.name}
                className="pl-3 sm:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 overflow-visible pt-3"
              >
                <button
                  onClick={() => handleBrandClick(brand.name)}
                  className="group cursor-pointer w-full active:scale-[0.92] transition-transform duration-150"
                  aria-label={`Filtrer par ${brand.name}`}
                  aria-pressed={selectedBrand === brand.name}
                >
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-[border-color,box-shadow,transform] duration-300",
                      selectedBrand === brand.name
                        ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30 -translate-y-1.5"
                        : "bg-card border border-border/50 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-2 hover:scale-[1.06]"
                    )}
                  >
                    {/* Shine effect overlay */}
                    <span className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden rounded-xl sm:rounded-2xl">
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    </span>
                    {/* Selection badge */}
                    {selectedBrand === brand.name && (
                      <div
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center animate-scale-in"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <svg 
                          className="relative w-2 h-2 sm:w-3 sm:h-3 text-primary-foreground" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Brand logo container */}
                    <div
                      className={cn(
                        "w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 flex items-center justify-center mb-2 sm:mb-3 rounded-lg sm:rounded-xl p-1.5 sm:p-2 transition-all duration-300",
                        selectedBrand === brand.name
                          ? "bg-white dark:bg-white/10 scale-110"
                          : "bg-white/80 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:scale-[1.15]"
                      )}
                    >
                      <img 
                        src={brand.logo} 
                        alt={`${brand.name} logo officiel`}
                        className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
                        loading="lazy"
                        draggable="false"
                      />
                    </div>
                    
                    {/* Brand name */}
                    <span className={cn(
                      "text-[10px] sm:text-xs md:text-sm font-medium transition-all duration-300 text-center leading-tight truncate w-full",
                      selectedBrand === brand.name
                        ? "text-primary font-semibold"
                        : "text-muted-foreground group-hover:text-foreground group-hover:font-semibold"
                    )}>
                      {brand.name}
                    </span>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious 
            className="-left-2 md:-left-5 bg-card border-border hover:bg-primary hover:text-primary-foreground hover:border-primary h-8 w-8 sm:h-9 sm:w-9" 
            aria-label="Marques précédentes"
          />
          <CarouselNext 
            className="-right-2 md:-right-5 bg-card border-border hover:bg-primary hover:text-primary-foreground hover:border-primary h-8 w-8 sm:h-9 sm:w-9" 
            aria-label="Marques suivantes"
          />
        </Carousel>
        
        {/* Dot indicators */}
        <div className="flex justify-center items-center gap-[3px] mt-1 h-3" role="tablist">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              role="tab"
              aria-selected={current === index}
              className={cn(
                "h-[3px] min-h-0 p-0 rounded-full transition-all duration-300",
                current === index
                  ? "bg-primary w-2.5"
                  : "w-[3px] bg-muted-foreground/20 hover:bg-muted-foreground/35"
              )}
              aria-label={`Aller à la diapositive ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

export default BrandCarousel;
