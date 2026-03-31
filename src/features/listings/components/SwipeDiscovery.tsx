/**
 * Premium Tinder-style swipe discovery for mobile.
 * Full-bleed luxury cards with glassmorphic actions, haptic feedback,
 * undo, progress bar, swipe stats, and share.
 * @module features/listings/components
 */

import { useState, useCallback, useRef, memo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import { Heart, X, Info, Eye, Undo2, Share2, Fuel, Calendar, Gauge } from "lucide-react";
import CarImage from "@/components/cars/CarImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import QuickPreviewSheet from "./QuickPreviewSheet";
import type { Vehicle } from "../types/vehicle.types";

/* ─── Props ─── */
interface SwipeDiscoveryProps {
  vehicles: Vehicle[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onVehicleClick: (id: string) => void;
}

/* ─── Helpers ─── */
const SWIPE_THRESHOLD = 90;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

const formatKm = (km: number) => new Intl.NumberFormat("fr-BE").format(km);

type SwipeDirection = "left" | "right";
interface HistoryEntry { index: number; direction: SwipeDirection }

/* ─── Single swipe card ─── */
const SwipeCard = memo(function SwipeCard({
  vehicle,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  isTop,
  isFav,
}: {
  vehicle: Vehicle;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onClick: () => void;
  isTop: boolean;
  isFav: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0]);
  // Subtle green/red tint on the card edges
  const likeTint = useTransform(x, [0, 150], ["hsla(var(--primary) / 0)", "hsla(var(--primary) / 0.08)"]);
  const nopeTint = useTransform(x, [-150, 0], ["hsla(0 80% 50% / 0.08)", "hsla(0 80% 50% / 0)"]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const vx = info.velocity.x;
      if (info.offset.x > SWIPE_THRESHOLD || vx > 400) {
        animate(x, 500, { type: "spring", stiffness: 300, damping: 30 });
        setTimeout(onSwipeRight, 180);
      } else if (info.offset.x < -SWIPE_THRESHOLD || vx < -400) {
        animate(x, -500, { type: "spring", stiffness: 300, damping: 30 });
        setTimeout(onSwipeLeft, 180);
      } else {
        animate(x, 0, { type: "spring", stiffness: 600, damping: 30 });
      }
    },
    [x, onSwipeLeft, onSwipeRight],
  );

  /* Background card (peek behind) */
  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 rounded-[2rem] overflow-hidden border border-border/10"
        initial={{ scale: 0.95, opacity: 0.7 }}
        animate={{ scale: 0.97, opacity: 0.85 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <CarImage
          src={vehicle.image || "/placeholder.svg"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          aspectRatio="auto"
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-black/30" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 cursor-grab active:cursor-grabbing will-change-transform"
      style={{ x, rotate, zIndex: 10, touchAction: "pan-y" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {/* Full-bleed image */}
      <CarImage
        src={vehicle.image || "/placeholder.svg"}
        alt={`${vehicle.brand} ${vehicle.model}`}
        aspectRatio="auto"
        eager
        className="w-full h-full"
      />

      {/* Directional color tints */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ background: likeTint }} />
      <motion.div className="absolute inset-0 pointer-events-none" style={{ background: nopeTint }} />

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

      {/* Favorite badge (top-left, only if already fav) */}
      {isFav && (
        <div className="absolute top-8 left-6 w-8 h-8 rounded-full bg-primary/20 backdrop-blur-xl flex items-center justify-center">
          <Heart className="w-4 h-4 text-primary fill-primary" />
        </div>
      )}

      {/* Bottom gradient overlay with vehicle info */}
      <div
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-28 pb-6 px-6"
        onClick={onClick}
      >
        <div className="space-y-2.5">
          {/* Brand & Model */}
          <div>
            <p className="text-white/50 text-[11px] font-medium tracking-[0.25em] uppercase">
              {vehicle.brand}
            </p>
            <h3 className="text-white text-[22px] font-light tracking-tight leading-tight mt-0.5">
              {vehicle.model}
            </h3>
          </div>

          {/* Price */}
          <p className="text-white text-3xl font-semibold tracking-tight">
            {formatPrice(vehicle.price)}
          </p>

          {/* Rich specs row with icons */}
          <div className="flex items-center gap-3 text-white/50 text-[12px] font-light">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {vehicle.year}
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              {formatKm(vehicle.mileage)} km
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1 capitalize">
              <Fuel className="w-3 h-3" />
              {vehicle.fuelType}
            </span>
          </div>

          {/* Location tag */}
          {vehicle.location && (
            <span className="inline-block text-white/40 text-[11px] font-light bg-white/5 backdrop-blur-sm rounded-full px-3 py-1 mt-1">
              📍 {vehicle.location}
            </span>
          )}
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { language } = useLanguage();
  const haptic = useHapticFeedback();

  const handleSwipeRight = useCallback(() => {
    haptic.notificationSuccess();
    const vehicle = vehicles[currentIndex];
    if (vehicle && !isFavorite(vehicle.id)) {
      onToggleFavorite(vehicle.id);
    }
    setHistory((prev) => [...prev, { index: currentIndex, direction: "right" }]);
    setLikedCount((c) => c + 1);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, vehicles, isFavorite, onToggleFavorite, haptic]);

  const handleSwipeLeft = useCallback(() => {
    haptic.impactLight();
    setHistory((prev) => [...prev, { index: currentIndex, direction: "left" }]);
    setPassedCount((c) => c + 1);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, haptic]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    haptic.selectionChanged();
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    if (last.direction === "right") {
      setLikedCount((c) => Math.max(0, c - 1));
      // Un-favorite if it was added by swipe
      const vehicle = vehicles[last.index];
      if (vehicle && isFavorite(vehicle.id)) {
        onToggleFavorite(vehicle.id);
      }
    } else {
      setPassedCount((c) => Math.max(0, c - 1));
    }
    setCurrentIndex(last.index);
  }, [history, haptic, vehicles, isFavorite, onToggleFavorite]);

  const handleClick = useCallback(() => {
    const vehicle = vehicles[currentIndex];
    if (vehicle) onVehicleClick(vehicle.id);
  }, [currentIndex, vehicles, onVehicleClick]);

  const handleQuickPreview = useCallback(() => {
    haptic.impactLight();
    setPreviewOpen(true);
  }, [haptic]);

  const handleShare = useCallback(async () => {
    const vehicle = vehicles[currentIndex];
    if (!vehicle) return;
    haptic.impactLight();
    const url = `${window.location.origin}/car/${vehicle.id}`;
    const text = `${vehicle.brand} ${vehicle.model} — ${formatPrice(vehicle.price)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [currentIndex, vehicles, haptic]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setHistory([]);
    setLikedCount(0);
    setPassedCount(0);
  }, []);

  if (vehicles.length === 0) return null;

  const isFinished = currentIndex >= vehicles.length;
  const progress = vehicles.length > 0 ? (currentIndex / vehicles.length) * 100 : 0;

  const t = {
    title: language === "nl" ? "Voor jou" : language === "en" ? "For You" : "Pour toi",
    subtitle: language === "nl" ? "Swipe rechts om toe te voegen" : language === "en" ? "Swipe right to save" : "Swipe pour découvrir",
    done: language === "nl" ? "Je hebt alles gezien!" : language === "en" ? "You've seen everything!" : "Tu as tout vu !",
    restart: language === "nl" ? "Opnieuw beginnen" : language === "en" ? "Start over" : "Recommencer",
    liked: language === "nl" ? "Bewaard" : language === "en" ? "Saved" : "Sauvés",
    passed: language === "nl" ? "Gepasseerd" : language === "en" ? "Passed" : "Passés",
    tapToView: language === "nl" ? "Tik om te ontdekken" : language === "en" ? "Tap to explore" : "Touche pour découvrir",
  };

  return (
    <section className="py-6 md:hidden">
      <div className="container mx-auto px-3">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground tracking-tight">{t.title}</h2>
            <p className="text-muted-foreground text-[11px] font-light tracking-wide mt-0.5">{t.subtitle}</p>
          </div>
          {!isFinished && (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums font-light">
              {currentIndex + 1} / {vehicles.length}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mx-1 mb-4 h-[3px] rounded-full bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Card stack */}
        <div
          className="relative w-full rounded-[2rem] overflow-hidden"
          style={{ height: "min(68vh, 500px)" }}
        >
          <AnimatePresence mode="popLayout">
            {isFinished ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/20 flex flex-col items-center justify-center gap-5 p-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <p className="text-foreground font-medium text-base tracking-tight">{t.done}</p>

                {/* Stats summary */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Heart className="w-4 h-4 fill-primary" />
                    <span className="font-semibold">{likedCount}</span>
                    <span className="text-muted-foreground font-light">{t.liked}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="font-semibold">{passedCount}</span>
                    <span className="font-light">{t.passed}</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  {t.restart}
                </button>
              </motion.div>
            ) : (
              <>
                {/* Peek card */}
                {currentIndex + 1 < vehicles.length && (
                  <SwipeCard
                    key={`bg-${vehicles[currentIndex + 1].id}`}
                    vehicle={vehicles[currentIndex + 1]}
                    onSwipeLeft={() => {}}
                    onSwipeRight={() => {}}
                    onClick={() => {}}
                    isTop={false}
                    isFav={isFavorite(vehicles[currentIndex + 1].id)}
                  />
                )}
                {/* Active card */}
                <SwipeCard
                  key={vehicles[currentIndex].id}
                  vehicle={vehicles[currentIndex]}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onClick={handleClick}
                  isTop={true}
                  isFav={isFavorite(vehicles[currentIndex].id)}
                />
              </>
            )}
          </AnimatePresence>

          {/* "Tap to explore" hint — shown only on first card */}
          {!isFinished && currentIndex === 0 && (
            <motion.p
              className="absolute bottom-3 inset-x-0 text-center text-white/30 text-[10px] font-light tracking-widest uppercase pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              {t.tapToView}
            </motion.p>
          )}
        </div>

        {/* Glassmorphic action buttons */}
        {!isFinished && (
          <div className="flex items-center justify-center gap-4 mt-5">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-10 h-10 rounded-full bg-card/40 backdrop-blur-xl border border-border/15 flex items-center justify-center active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:pointer-events-none"
              aria-label="Annuler"
            >
              <Undo2 className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Pass */}
            <button
              onClick={handleSwipeLeft}
              className="w-14 h-14 rounded-full bg-card/50 backdrop-blur-xl border border-border/20 flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg shadow-black/5"
              aria-label="Passer"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>

            {/* Details (Quick Preview) */}
            <button
              onClick={handleQuickPreview}
              className="w-11 h-11 rounded-full bg-card/50 backdrop-blur-xl border border-border/20 flex items-center justify-center active:scale-90 transition-transform duration-150"
              aria-label="Aperçu rapide"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Favorite */}
            <button
              onClick={handleSwipeRight}
              className="w-14 h-14 rounded-full bg-primary/15 backdrop-blur-xl border border-primary/25 flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg shadow-primary/10"
              aria-label="Ajouter aux favoris"
            >
              <Heart className="w-6 h-6 text-primary" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-card/40 backdrop-blur-xl border border-border/15 flex items-center justify-center active:scale-90 transition-all duration-150"
              aria-label="Partager"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
      {/* Quick preview bottom sheet — outside container to use fixed positioning */}
      <QuickPreviewSheet
        vehicle={!isFinished ? vehicles[currentIndex] : null}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onViewDetail={onVehicleClick}
        onToggleFavorite={onToggleFavorite}
        isFavorite={!isFinished && vehicles[currentIndex] ? isFavorite(vehicles[currentIndex].id) : false}
        photos={!isFinished && vehicles[currentIndex]?.photos ? vehicles[currentIndex].photos : undefined}
      />
    </section>
  );
});

export default SwipeDiscovery;
