/**
 * BrandCarousel component - auto-playing carousel of brand logos
 * @module features/search/components
 */

import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  { name: "Hyundai", logo: hyundaiLogo, color: "#002C5F" },
  { name: "Kia", logo: kiaLogo, color: "#05141F" },
  { name: "Fiat", logo: fiatLogo, color: "#8B0000" },
  { name: "Volvo", logo: volvoLogo, color: "#003057" },
  { name: "Škoda", logo: skodaLogo, color: "#4BA82E" },
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
      className="py-2 sm:py-4 bg-gradient-to-b from-muted/30 to-background"
      aria-labelledby="brands-title"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <h2 
          id="brands-title"
          className="text-lg sm:text-xl md:text-2xl font-display font-bold text-center mb-3 sm:mb-4 text-foreground"
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
          className="w-full max-w-5xl mx-auto px-10 md:px-14"
        >
          <CarouselContent className="-ml-2 sm:-ml-4">
            {BRANDS.map((brand) => (
              <CarouselItem
                key={brand.name}
                className="pl-2 sm:pl-4 basis-1/4 sm:basis-1/4 md:basis-1/5"
              >
                <motion.button
                  onClick={() => handleBrandClick(brand.name)}
                  className="group cursor-pointer w-full"
                  aria-label={`Filtrer par ${brand.name}`}
                  aria-pressed={selectedBrand === brand.name}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 rounded-lg sm:rounded-xl",
                      selectedBrand === brand.name
                        ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                        : "bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                    )}
                    animate={selectedBrand === brand.name
                      ? { y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }
                      : { y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }
                    }
                    whileHover={selectedBrand !== brand.name ? { y: -4, scale: 1.02 } : {}}
                  >
                    {/* Selection badge with pulse effect */}
                    <AnimatePresence>
                      {selectedBrand === brand.name && (
                        <motion.div
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Brand logo container */}
                    <motion.div
                      className={cn(
                        "w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center mb-1.5 sm:mb-3 rounded-md sm:rounded-lg p-1 sm:p-2",
                        selectedBrand === brand.name
                          ? "bg-white dark:bg-white/10"
                          : "bg-white/80 dark:bg-white/5"
                      )}
                      animate={selectedBrand === brand.name
                        ? { scale: 1.1 }
                        : { scale: 1 }
                      }
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <img 
                        src={brand.logo} 
                        alt={`${brand.name} logo officiel`}
                        className="w-full h-full object-contain drop-shadow-sm"
                        loading="lazy"
                        draggable="false"
                      />
                    </motion.div>
                    
                    {/* Brand name */}
                    <span className={cn(
                      "text-[10px] sm:text-xs md:text-sm font-medium transition-colors duration-300 text-center leading-tight truncate w-full",
                      selectedBrand === brand.name
                        ? "text-primary font-semibold"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {brand.name}
                    </span>
                  </motion.div>
                </motion.button>
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
        <div className="flex justify-center gap-[3px] mt-2" role="tablist">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              role="tab"
              aria-selected={current === index}
              className={cn(
                "h-[3px] rounded-full transition-all duration-300",
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
