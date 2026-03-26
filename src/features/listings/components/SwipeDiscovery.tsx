/**
 * Premium Tinder-style swipe discovery for mobile.
 * Full-bleed luxury cards with glassmorphic actions and haptic feedback.
 * @module features/listings/components
 */

import { useState, useCallback, memo } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Heart, X, Info, Eye } from "lucide-react";
import CarImage from "@/components/cars/CarImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import type { Vehicle } from "../types/vehicle.types";

interface SwipeDiscoveryProps {
  vehicles: Vehicle[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onVehicleClick: (id: string) => void;
}

const SWIPE_THRESHOLD = 100;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

const formatKm = (km: number) => new Intl.NumberFormat("fr-BE").format(km);

/* ─── Single swipe card ─── */
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
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const vx = info.velocity.x;
      if (info.offset.x > SWIPE_THRESHOLD || vx > 500) {
        animate(x, 600, { type: "spring", stiffness: 250, damping: 28 });
        setTimeout(onSwipeRight, 200);
      } else if (info.offset.x < -SWIPE_THRESHOLD || vx < -500) {
        animate(x, -600, { type: "spring", stiffness: 250, damping: 28 });
        setTimeout(onSwipeLeft, 200);
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      }
    },
    [x, onSwipeLeft, onSwipeRight]
  );

  /* Background card (peek behind) */
  if (!isTop) {
    return (
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden border border-border/10">
        <CarImage
          src={vehicle.image || "/placeholder.svg"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          aspectRatio="auto"
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 cursor-grab active:cursor-grabbing will-change-transform"
      style={{ x, rotate, zIndex: 10, touchAction: "pan-y" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
    >
      {/* Full-bleed image */}
      <CarImage
        src={vehicle.image || "/placeholder.svg"}
        alt={`${vehicle.brand} ${vehicle.model}`}
        aspectRatio="auto"
        eager
        className="w-full h-full"
      />

      {/* Swipe overlay indicators */}
      <motion.div
        className="absolute top-8 right-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-primary/40 bg-primary/15 backdrop-blur-xl"
        style={{ opacity: likeOpacity }}
      >
        <Heart className="w-5 h-5 text-primary fill-primary" />
        <span className="text-primary font-semibold text-sm tracking-widest uppercase">Favori</span>
      </motion.div>
      <motion.div
        className="absolute top-8 left-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-destructive/40 bg-destructive/15 backdrop-blur-xl"
        style={{ opacity: nopeOpacity }}
      >
        <X className="w-5 h-5 text-destructive" />
        <span className="text-destructive font-semibold text-sm tracking-widest uppercase">Passer</span>
      </motion.div>

      {/* Bottom gradient overlay with vehicle info */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-24 pb-6 px-6">
        <div className="space-y-3" onClick={onClick}>
          {/* Brand & Model */}
          <div>
            <p className="text-white/60 text-xs font-medium tracking-[0.2em] uppercase">
              {vehicle.brand}
            </p>
            <h3 className="text-white text-2xl font-light tracking-tight leading-tight mt-0.5">
              {vehicle.model}
            </h3>
          </div>

          {/* Price */}
          <p className="text-white text-3xl font-medium tracking-tight">
            {formatPrice(vehicle.price)}
          </p>

          {/* Specs row */}
          <div className="flex items-center gap-4 text-white/50 text-[13px] font-light">
            <span>{vehicle.year}</span>
            <span className="w-px h-3 bg-white/20" />
            <span>{formatKm(vehicle.mileage)} km</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="capitalize">{vehicle.fuelType}</span>
            {vehicle.location && (
              <>
                <span className="w-px h-3 bg-white/20" />
                <span className="truncate max-w-[100px]">{vehicle.location}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/* ─── Main component ─── */
const SwipeDiscovery = memo(function SwipeDiscovery({
  vehicles,
  isFavorite,
  onToggleFavorite,
  onVehicleClick,
}: SwipeDiscoveryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { language } = useLanguage();
  const haptic = useHapticFeedback();

  const handleSwipeRight = useCallback(() => {
    haptic.notificationSuccess();
    const vehicle = vehicles[currentIndex];
    if (vehicle && !isFavorite(vehicle.id)) {
      onToggleFavorite(vehicle.id);
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, vehicles, isFavorite, onToggleFavorite, haptic]);

  const handleSwipeLeft = useCallback(() => {
    haptic.impactLight();
    setCurrentIndex((prev) => prev + 1);
  }, [haptic]);

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
    subtitle: language === "nl" ? "Swipe rechts om toe te voegen" : language === "en" ? "Swipe right to add" : "Swipe à droite pour ajouter",
    done: language === "nl" ? "Je hebt alles gezien!" : language === "en" ? "You've seen everything!" : "Tu as tout vu !",
    restart: language === "nl" ? "Opnieuw beginnen" : language === "en" ? "Start over" : "Recommencer",
  };

  return (
    <section className="py-6 md:hidden">
      <div className="container mx-auto px-3">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground tracking-tight">{texts.title}</h2>
            <p className="text-muted-foreground text-[11px] font-light tracking-wide mt-0.5">{texts.subtitle}</p>
          </div>
          {!isFinished && (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums font-light">
              {currentIndex + 1} / {vehicles.length}
            </span>
          )}
        </div>

        {/* Card stack — full-bleed height */}
        <div
          className="relative w-full rounded-[2rem] overflow-hidden"
          style={{ height: "min(70vh, 520px)" }}
        >
          {isFinished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/20 flex flex-col items-center justify-center gap-5 p-8"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <p className="text-foreground font-medium text-base tracking-tight">{texts.done}</p>
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                {texts.restart}
              </button>
            </motion.div>
          ) : (
            <>
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

        {/* Glassmorphic action buttons */}
        {!isFinished && (
          <div className="flex items-center justify-center gap-5 mt-5">
            <button
              onClick={handleSwipeLeft}
              className="w-14 h-14 rounded-full bg-card/50 backdrop-blur-xl border border-border/20 flex items-center justify-center active:scale-90 transition-transform duration-150"
              aria-label="Passer"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
            <button
              onClick={handleClick}
              className="w-11 h-11 rounded-full bg-card/50 backdrop-blur-xl border border-border/20 flex items-center justify-center active:scale-90 transition-transform duration-150"
              aria-label="Détails"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleSwipeRight}
              className="w-14 h-14 rounded-full bg-primary/15 backdrop-blur-xl border border-primary/25 flex items-center justify-center active:scale-90 transition-transform duration-150"
              aria-label="Ajouter aux favoris"
            >
              <Heart className="w-6 h-6 text-primary" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
});

export default SwipeDiscovery;
