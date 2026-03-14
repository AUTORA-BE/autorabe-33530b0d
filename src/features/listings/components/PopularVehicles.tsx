/**
 * PopularVehicles component - horizontal carousel of trending vehicles
 * Uses CarCard for visual consistency with the main search grid
 * @module features/listings/components
 */

import { useRef, memo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import CarCard from "./CarCard";
import { usePopularVehicles } from "../hooks/usePopularVehicles";
import { CarCardSkeleton } from "@/components/skeletons/HomeSkeleton";

export interface PopularVehiclesProps {
  isFavorite: (vehicleId: string) => boolean;
  onToggleFavorite: (vehicleId: string) => void;
  onVehicleClick: (vehicleId: string) => void;
}

const PopularVehicles = memo(function PopularVehicles({
  isFavorite,
  onToggleFavorite,
  onVehicleClick,
}: PopularVehiclesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { vehicles, isLoading } = usePopularVehicles();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const texts = {
    noListings: language === "nl" ? "Geen advertenties beschikbaar" : language === "en" ? "No listings available" : "Aucune annonce disponible",
    beFirst: language === "nl" ? "Wees de eerste om een advertentie te plaatsen op AutoRa en bereik duizenden potentiële kopers." : language === "en" ? "Be the first to post a listing on AutoRa and reach thousands of potential buyers." : "Soyez le premier à publier une annonce sur AutoRa et touchez des milliers d'acheteurs potentiels.",
    postListing: language === "nl" ? "Een advertentie plaatsen" : language === "en" ? "Post a listing" : "Publier une annonce",
    popular: language === "nl" ? "Populaire Auto's" : language === "en" ? "Popular Cars" : "Voitures Populaires",
    mostSearched: language === "nl" ? "De meest gezochte voertuigen deze week" : language === "en" ? "The most searched vehicles this week" : "Les véhicules les plus recherchés cette semaine",
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 360;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!isLoading && vehicles.length === 0) {
    return (
      <section className="py-12 sm:py-16 overflow-hidden" aria-labelledby="popular-vehicles-title">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center py-10 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="w-8 h-8 sm:w-10 sm:h-10 text-primary" aria-hidden="true" />
            </div>
            <h2 id="popular-vehicles-title" className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4">
              {texts.noListings}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm sm:text-base px-4">
              {texts.beFirst}
            </p>
            <Button onClick={() => navigate("/sell")} className="btn-primary-gradient">
              {texts.postListing}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-16 overflow-hidden" aria-labelledby="popular-vehicles-heading">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="popular-vehicles-heading" className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                {texts.popular}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                {texts.mostSearched}
              </p>
            </div>
          </div>

          {vehicles.length > 3 && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                aria-label="Défiler vers la gauche"
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors group touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="Défiler vers la droite"
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors group touch-manipulation"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div className="flex gap-4 sm:gap-6 overflow-hidden" role="status" aria-label="Chargement">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px]">
                <CarCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px] snap-start"
              >
                <CarCard
                  car={vehicle}
                  isFavorite={isFavorite(vehicle.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onVehicleClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default PopularVehicles;
