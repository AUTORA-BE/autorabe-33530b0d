/**
 * PopularVehicles — horizontal carousel with luxe minimal header
 * @module features/listings/components
 */

import { useRef, memo, useMemo } from "react";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import CarCard from "./CarCard";
import { usePopularVehicles } from "../hooks/usePopularVehicles";
import { CarCardSkeleton } from "@/components/skeletons/HomeSkeleton";
import { useFavoriteCounts } from "@/features/favorites/hooks/useFavoriteCounts";

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
  const listingIds = useMemo(() => vehicles.map(v => v.id), [vehicles]);
  const favCounts = useFavoriteCounts(listingIds);

  const texts = {
    noListings: language === "nl" ? "Geen advertenties beschikbaar" : language === "en" ? "No listings available" : "Aucune annonce disponible",
    beFirst: language === "nl" ? "Wees de eerste om een advertentie te plaatsen op AutoRA." : language === "en" ? "Be the first to post a listing on AutoRA." : "Soyez le premier à publier une annonce sur AutoRA.",
    postListing: language === "nl" ? "Een advertentie plaatsen" : language === "en" ? "Post a listing" : "Publier une annonce",
    popular: language === "nl" ? "Populaire auto's" : language === "en" ? "Popular cars" : "Voitures populaires",
    mostSearched: language === "nl" ? "De meest gezochte voertuigen deze week" : language === "en" ? "Most searched vehicles this week" : "Les véhicules les plus recherchés cette semaine",
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -360 : 360,
        behavior: "smooth",
      });
    }
  };

  if (!isLoading && vehicles.length === 0) {
    return (
      <section className="py-20 sm:py-28 overflow-hidden">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center">
              <Car className="w-7 h-7 text-primary/60" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-foreground mb-3">
              {texts.noListings}
            </h2>
            <p className="text-muted-foreground text-sm font-light max-w-md mx-auto mb-8">
              {texts.beFirst}
            </p>
            <Button onClick={() => navigate("/sell")} className="rounded-full h-12 px-8 font-medium text-sm">
              {texts.postListing}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8">
        {/* Header — luxe minimal */}
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11px] uppercase tracking-[0.25em] text-primary/70 font-medium mb-3"
            >
              {language === "nl" ? "Trending" : language === "en" ? "Trending" : "Tendances"}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-foreground leading-tight"
            >
              {texts.popular}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-sm font-light mt-2"
            >
              {texts.mostSearched}
            </motion.p>
          </div>

          {vehicles.length > 3 && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full border border-border/20 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:border-primary/20 transition-all"
                aria-label="Précédent"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full border border-border/20 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:border-primary/20 transition-all"
                aria-label="Suivant"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[300px] sm:w-[340px]">
                <CarCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-6 px-6 sm:-mx-8 sm:px-8"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            {vehicles.map((vehicle, idx) => (
              <div key={vehicle.id} className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start">
                <CarCard
                  car={vehicle}
                  isFavorite={isFavorite(vehicle.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onVehicleClick}
                  favoriteCount={favCounts[vehicle.id]}
                  eager={idx === 0}
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
