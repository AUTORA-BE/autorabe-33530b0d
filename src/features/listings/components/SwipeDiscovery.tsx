/**
 * Tinder-style swipe discovery cards for mobile
 * Swipe right → add to favorites, swipe left → skip
 * @module features/listings/components
 */

import { useState, useCallback, memo } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Heart, X, MapPin, Calendar, Gauge, Fuel, Eye } from "lucide-react";
import CarImage from "@/components/cars/CarImage";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Vehicle } from "../types/vehicle.types";

interface SwipeDiscoveryProps {
  vehicles: Vehicle[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onVehicleClick: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

const formatKm = (km: number) => new Intl.NumberFormat("fr-BE").format(km);

const SwipeCard = memo(function SwipeCard({
  vehicle,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  isTop,
}: {
  vehicle: Vehicle;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onClick: () => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        animate(x, 400, { duration: 0.3 });
        setTimeout(onSwipeRight, 200);
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        animate(x, -400, { duration: 0.3 });
        setTimeout(onSwipeLeft, 200);
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      }
    },
    [x, onSwipeLeft, onSwipeRight]
  );

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 rounded-3xl overflow-hidden bg-card border border-border/50"
        style={{ scale: 0.95, y: 8 }}
      >
        <div className="relative w-full h-full">
          <CarImage
            src={vehicle.image || "/placeholder.svg"}
            alt={`${vehicle.brand} ${vehicle.model}`}
            aspectRatio="3/4"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden bg-card border border-border/50 shadow-2xl cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: 10, touchAction: "pan-y" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.97 }}
    >
      {/* Image */}
      <div className="relative w-full h-[65%]">
        <CarImage
          src={vehicle.image || "/placeholder.svg"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          aspectRatio="3/4"
          eager
          className="w-full h-full object-cover"
        />

        {/* Swipe indicators */}
        <motion.div
          className="absolute top-6 right-6 px-4 py-2 rounded-xl border-2 border-primary bg-primary/20 backdrop-blur-sm"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-primary font-black text-xl tracking-wider">LIKE</span>
        </motion.div>
        <motion.div
          className="absolute top-6 left-6 px-4 py-2 rounded-xl border-2 border-destructive bg-destructive/20 backdrop-blur-sm"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-destructive font-black text-xl tracking-wider">NOPE</span>
        </motion.div>

        {/* Price overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          <span className="text-3xl font-black text-white drop-shadow-lg">
            {formatPrice(vehicle.price)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2" onClick={onClick}>
        <h3 className="font-display text-xl font-bold text-foreground">
          {vehicle.brand} {vehicle.model}
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gauge className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{formatKm(vehicle.mileage)} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Fuel className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="capitalize">{vehicle.fuelType}</span>
          </div>
          {vehicle.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="truncate">{vehicle.location}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const SwipeDiscovery = memo(function SwipeDiscovery({
  vehicles,
  isFavorite,
  onToggleFavorite,
  onVehicleClick,
}: SwipeDiscoveryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { language } = useLanguage();

  const handleSwipeRight = useCallback(() => {
    const vehicle = vehicles[currentIndex];
    if (vehicle && !isFavorite(vehicle.id)) {
      onToggleFavorite(vehicle.id);
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, vehicles, isFavorite, onToggleFavorite]);

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleClick = useCallback(() => {
    const vehicle = vehicles[currentIndex];
    if (vehicle) onVehicleClick(vehicle.id);
  }, [currentIndex, vehicles, onVehicleClick]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  if (vehicles.length === 0) return null;

  const isFinished = currentIndex >= vehicles.length;

  const texts = {
    title: language === "nl" ? "Voor jou" : language === "en" ? "For You" : "Pour toi",
    subtitle: language === "nl" ? "Swipe rechts om toe te voegen aan favorieten" : language === "en" ? "Swipe right to add to favorites" : "Swipe à droite pour ajouter aux favoris",
    done: language === "nl" ? "Je hebt alles gezien!" : language === "en" ? "You've seen everything!" : "Tu as tout vu !",
    restart: language === "nl" ? "Opnieuw beginnen" : language === "en" ? "Start over" : "Recommencer",
    remaining: language === "nl" ? "resterend" : language === "en" ? "remaining" : "restants",
  };

  return (
    <section className="py-6 md:hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{texts.title}</h2>
            <p className="text-muted-foreground text-xs">{texts.subtitle}</p>
          </div>
        </div>

        {/* Card Stack */}
        <div className="relative w-full aspect-[3/4] max-h-[480px]">
          {isFinished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 rounded-3xl bg-card border border-border/50 flex flex-col items-center justify-center gap-4 p-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-semibold text-lg">{texts.done}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 active:scale-95 transition-transform"
              >
                {texts.restart}
              </button>
            </motion.div>
          ) : (
            <>
              {/* Next card (behind) */}
              {currentIndex + 1 < vehicles.length && (
                <SwipeCard
                  key={vehicles[currentIndex + 1].id}
                  vehicle={vehicles[currentIndex + 1]}
                  onSwipeLeft={() => {}}
                  onSwipeRight={() => {}}
                  onClick={() => {}}
                  isTop={false}
                />
              )}
              {/* Current card (top) */}
              <SwipeCard
                key={vehicles[currentIndex].id}
                vehicle={vehicles[currentIndex]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onClick={handleClick}
                isTop={true}
              />
            </>
          )}
        </div>

        {/* Action buttons */}
        {!isFinished && (
          <div className="flex items-center justify-center gap-6 mt-4">
            <button
              onClick={handleSwipeLeft}
              className="w-14 h-14 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              aria-label="Passer"
            >
              <X className="w-7 h-7 text-destructive" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentIndex + 1}/{vehicles.length}
            </span>
            <button
              onClick={handleSwipeRight}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
              aria-label="Ajouter aux favoris"
            >
              <Heart className="w-7 h-7" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
});

export default SwipeDiscovery;
