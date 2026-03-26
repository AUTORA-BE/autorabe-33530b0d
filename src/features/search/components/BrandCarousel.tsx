/**
 * BrandCarousel — minimal, polished brand logos with thin arrows
 * @module features/search/components
 */

import { useState, useEffect, useCallback, memo } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

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

  const handleBrandClick = (brandName: string) => {
    if (onBrandFilter) {
      onBrandFilter(selectedBrand === brandName ? "" : brandName);
    }
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section 
      className="py-10 sm:py-16"
      aria-labelledby="brands-title"
      style={{ contain: "layout style" }}
    >
      <div className="container mx-auto px-6 sm:px-8">
        <h2 
          id="brands-title"
          className="font-serif text-lg sm:text-2xl font-light text-center mb-6 sm:mb-10 text-foreground"
        >
          {t("brands.title")}
        </h2>
        
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            plugins={[
              Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true }),
            ]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className="-ml-2 sm:-ml-3">
              {BRANDS.map((brand) => (
                <CarouselItem
                  key={brand.name}
                  className="pl-2 sm:pl-3 basis-1/4 sm:basis-1/5 md:basis-1/6"
                >
                  <button
                    onClick={() => handleBrandClick(brand.name)}
                    className="group cursor-pointer w-full active:scale-[0.92] transition-transform duration-150"
                    aria-label={`Filtrer par ${brand.name}`}
                    aria-pressed={selectedBrand === brand.name}
                  >
                    <div
                      className={cn(
                        "relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl transition-all duration-300",
                        selectedBrand === brand.name
                          ? "bg-primary/8 border border-primary/20"
                          : "border border-transparent hover:border-border/30"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-2 sm:mb-3 rounded-2xl p-2 sm:p-3 transition-all duration-300",
                        "bg-white/80 dark:bg-white/5"
                      )}>
                        <img 
                          src={brand.logo} 
                          alt={`${brand.name} logo`}
                          className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                          loading="lazy"
                          draggable="false"
                        />
                      </div>
                      
                      <span className={cn(
                        "text-[10px] sm:text-xs font-light transition-all duration-300 text-center leading-tight truncate w-full",
                        selectedBrand === brand.name
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {brand.name}
                      </span>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Thin, minimal navigation arrows */}
          <button
            onClick={() => api?.scrollPrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
            aria-label="Marques précédentes"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1} />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
            aria-label="Marques suivantes"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1} />
          </button>
        </div>
      </div>
    </section>
  );
});

export default BrandCarousel;
