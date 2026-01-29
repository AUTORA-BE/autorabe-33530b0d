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
import volkswagenLogo from "@/assets/brands/volkswagen.svg";
import bmwLogo from "@/assets/brands/bmw.svg";
import audiLogo from "@/assets/brands/audi.svg";
import mercedesLogo from "@/assets/brands/mercedes.svg";
import peugeotLogo from "@/assets/brands/peugeot.svg";
import renaultLogo from "@/assets/brands/renault.svg";
import citroenLogo from "@/assets/brands/citroen.svg";
import toyotaLogo from "@/assets/brands/toyota.svg";
import fordLogo from "@/assets/brands/ford.svg";
import opelLogo from "@/assets/brands/opel.svg";

import type { BrandConfig } from "../types/search.types";

/**
 * Brand configuration with official logos
 */
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
];

/**
 * Props for the BrandCarousel component
 */
export interface BrandCarouselProps {
  /** Callback when a brand is selected/deselected */
  onBrandFilter?: (brand: string) => void;
  /** Currently selected brand */
  selectedBrand?: string;
}

/**
 * BrandCarousel displays an auto-playing carousel of car brand logos
 * Clicking a brand filters the vehicle listings
 */
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

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
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
      className="py-8 sm:py-12 bg-gradient-to-b from-muted/30 to-background"
      aria-labelledby="brands-title"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <h2 
          id="brands-title"
          className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-center mb-6 sm:mb-8 text-foreground"
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
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-2 sm:-ml-4">
            {BRANDS.map((brand) => (
              <CarouselItem
                key={brand.name}
                className="pl-2 sm:pl-4 basis-1/4 sm:basis-1/4 md:basis-1/5"
              >
                <button
                  onClick={() => handleBrandClick(brand.name)}
                  className="group cursor-pointer w-full"
                  aria-label={`Filtrer par ${brand.name}`}
                  aria-pressed={selectedBrand === brand.name}
                >
                  <div className={cn(
                    "relative flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 rounded-lg sm:rounded-xl transition-all duration-300 hover:-translate-y-1",
                    selectedBrand === brand.name
                      ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                      : "bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                  )}>
                    {/* Selection badge with pulse effect */}
                    {selectedBrand === brand.name && (
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center">
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
                    <div className={cn(
                      "w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center mb-1.5 sm:mb-3 transition-all duration-300 rounded-md sm:rounded-lg p-1 sm:p-2",
                      selectedBrand === brand.name
                        ? "scale-110 bg-white dark:bg-white/10"
                        : "group-hover:scale-105 bg-white/80 dark:bg-white/5"
                    )}>
                      <img 
                        src={brand.logo} 
                        alt={`${brand.name} logo officiel`}
                        className="w-full h-full object-contain drop-shadow-sm"
                        loading="lazy"
                        draggable="false"
                      />
                    </div>
                    
                    {/* Brand name */}
                    <span className={cn(
                      "text-[10px] sm:text-xs md:text-sm font-medium transition-colors duration-300 text-center leading-tight truncate w-full",
                      selectedBrand === brand.name
                        ? "text-primary font-semibold"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {brand.name}
                    </span>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious 
            className="hidden md:flex -left-12 bg-card border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" 
            aria-label="Marques précédentes"
          />
          <CarouselNext 
            className="hidden md:flex -right-12 bg-card border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" 
            aria-label="Marques suivantes"
          />
        </Carousel>
        
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6" role="tablist">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              role="tab"
              aria-selected={current === index}
              className={cn(
                "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300",
                current === index
                  ? "bg-primary w-4 sm:w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
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
