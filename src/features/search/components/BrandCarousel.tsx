/**
 * BrandCarousel — minimal, polished brand logos with thin arrows
 * @module features/search/components
 */

import {   useState, memo } from "react";
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
import { BRAND_MODELS } from "@/data/brandModels";
export { BRAND_MODELS } from "@/data/brandModels";

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
  onModelFilter?: (model: string) => void;
  selectedModel?: string;
}

const BrandCarousel = memo(function BrandCarousel({
  onBrandFilter,
  selectedBrand,
  onModelFilter,
  selectedModel,
}: BrandCarouselProps) {
  const { t } = useLanguage();
  const [api, setApi] = useState<CarouselApi>();

  const models = selectedBrand ? (BRAND_MODELS[selectedBrand] ?? []) : [];

  const handleBrandClick = (brandName: string) => {
    if (onBrandFilter) {
      onBrandFilter(selectedBrand === brandName ? "" : brandName);
    }
    if (onModelFilter) onModelFilter("");
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleModelClick = (model: string) => {
    if (onModelFilter) {
      onModelFilter(selectedModel === model ? "" : model);
    }
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section 
      className="py-12 sm:py-20"
      aria-labelledby="brands-title"
      style={{ contain: "layout style" }}
    >
      <div className="container mx-auto px-6 sm:px-8">
        <h2 
          id="brands-title"
          className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-center mb-8 sm:mb-12 text-foreground"
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
                        "w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center mb-2 sm:mb-3 rounded-2xl p-2.5 sm:p-3.5 transition-all duration-300 shadow-sm",
                        "bg-white",
                        selectedBrand === brand.name && "ring-2 ring-primary/40"
                      )}>
                        <img
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
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

          {/* Navigation arrows — glass effect for visibility on light & dark */}
          <button
            onClick={() => api?.scrollPrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all shadow-sm"
            aria-label="Marques précédentes"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all shadow-sm"
            aria-label="Marques suivantes"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Model chips — appear when a brand is selected */}
        {models.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {models.map((model) => (
              <button
                key={model}
                onClick={() => handleModelClick(model)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-light border transition-all duration-200",
                  selectedModel === model
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {model}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default BrandCarousel;
