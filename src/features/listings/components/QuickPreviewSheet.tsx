/**
 * Bottom-sheet quick preview for a vehicle card.
 * Glassmorphic design, swipe-to-dismiss, with image carousel & CTA.
 * @module features/listings/components
 */

import { memo, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, Heart, ExternalLink, Calendar, Gauge, Fuel, MapPin, Cog, Shield, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import CarImage from "@/components/cars/CarImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import type { Vehicle } from "../types/vehicle.types";

interface QuickPreviewSheetProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetail: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  /** Optional array of photo URLs; falls back to vehicle.image */
  photos?: string[];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

const formatKm = (km: number) => new Intl.NumberFormat("fr-BE").format(km);

const QuickPreviewSheet = memo(function QuickPreviewSheet({
  vehicle,
  isOpen,
  onClose,
  onViewDetail,
  onToggleFavorite,
  isFavorite,
  photos: photosProp,
}: QuickPreviewSheetProps) {
  const { language } = useLanguage();
  const haptic = useHapticFeedback();

  const images = photosProp?.length ? photosProp : vehicle?.image ? [vehicle.image] : ["/placeholder.svg"];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, containScroll: false });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Reset carousel when vehicle changes
  useEffect(() => {
    if (emblaApi && isOpen) {
      emblaApi.scrollTo(0, true);
      setActiveIndex(0);
    }
  }, [vehicle?.id, isOpen, emblaApi]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 80 || info.velocity.y > 300) {
        haptic.impactLight();
        onClose();
      }
    },
    [onClose, haptic],
  );

  const handleFavorite = useCallback(() => {
    if (!vehicle) return;
    haptic.notificationSuccess();
    onToggleFavorite(vehicle.id);
  }, [vehicle, onToggleFavorite, haptic]);

  const handleViewDetail = useCallback(() => {
    if (!vehicle) return;
    haptic.impactLight();
    onClose();
    setTimeout(() => onViewDetail(vehicle.id), 200);
  }, [vehicle, onViewDetail, onClose, haptic]);

  const t = {
    viewDetail: language === "nl" ? "Bekijk details" : language === "en" ? "View details" : "Voir les détails",
    specs: language === "nl" ? "Kenmerken" : language === "en" ? "Specifications" : "Caractéristiques",
    year: language === "nl" ? "Jaar" : language === "en" ? "Year" : "Année",
    mileage: language === "nl" ? "Kilometerstand" : language === "en" ? "Mileage" : "Kilométrage",
    fuel: language === "nl" ? "Brandstof" : language === "en" ? "Fuel" : "Carburant",
    transmission: language === "nl" ? "Transmissie" : language === "en" ? "Transmission" : "Transmission",
    location: language === "nl" ? "Locatie" : language === "en" ? "Location" : "Localisation",
    lez: language === "nl" ? "LEZ compatibel" : language === "en" ? "LEZ compatible" : "Compatible LEZ",
    carPass: language === "nl" ? "Car-Pass" : language === "en" ? "Car-Pass" : "Car-Pass",
  };

  const content = (
    <AnimatePresence>
      {isOpen && vehicle && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 max-h-[85vh] overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            style={{ touchAction: "none" }}
          >
            <div className="bg-card/95 backdrop-blur-2xl border-t border-border/20 rounded-t-[1.5rem] overflow-hidden">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto max-h-[calc(85vh-2rem)] pb-safe overscroll-contain">
                {/* Image carousel */}
                <div className="relative mx-4 rounded-2xl overflow-hidden" style={{ height: "180px" }}>
                  <div ref={emblaRef} className="overflow-hidden h-full">
                    <div className="flex h-full">
                      {images.map((src, i) => (
                        <div key={i} className="flex-[0_0_100%] min-w-0 h-full">
                          <CarImage
                            src={src}
                            alt={`${vehicle.brand} ${vehicle.model} – ${i + 1}`}
                            aspectRatio="auto"
                            eager={i === 0}
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dot indicators */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 z-10">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => emblaApi?.scrollTo(i)}
                          className={`rounded-full transition-all duration-200 ${
                            i === activeIndex
                              ? "w-5 h-1.5 bg-white"
                              : "w-1.5 h-1.5 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Photo counter */}
                  {images.length > 1 && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-medium z-10">
                      {activeIndex + 1}/{images.length}
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-transform z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Vehicle info */}
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.2em] uppercase">
                        {vehicle.brand}
                      </p>
                      <h3 className="text-foreground text-xl font-light tracking-tight mt-0.5 truncate">
                        {vehicle.model}
                      </h3>
                    </div>
                    <button
                      onClick={handleFavorite}
                      className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150 ${
                        isFavorite
                          ? "bg-primary/15 border border-primary/30"
                          : "bg-muted/30 border border-border/20"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          isFavorite ? "text-primary fill-primary" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-foreground text-2xl font-semibold tracking-tight mt-2">
                    {formatPrice(vehicle.price)}
                  </p>
                </div>

                {/* Specs grid */}
                <div className="px-5 py-3">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase mb-3">
                    {t.specs}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <SpecItem icon={Calendar} label={t.year} value={String(vehicle.year)} />
                    <SpecItem icon={Gauge} label={t.mileage} value={`${formatKm(vehicle.mileage)} km`} />
                    <SpecItem icon={Fuel} label={t.fuel} value={vehicle.fuelType} />
                    <SpecItem icon={Cog} label={t.transmission} value={vehicle.transmission} />
                    {vehicle.location && (
                      <SpecItem icon={MapPin} label={t.location} value={vehicle.location} />
                    )}
                    {vehicle.isLezCompatible && (
                      <SpecItem icon={Shield} label={t.lez} value="✓" highlight />
                    )}
                    {vehicle.hasCarPass && (
                      <SpecItem icon={Shield} label={t.carPass} value="✓" highlight />
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 pt-2 pb-6">
                  <button
                    onClick={handleViewDetail}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm tracking-wide shadow-lg shadow-primary/15 active:scale-[0.98] transition-transform"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.viewDetail}
                    <ChevronRight className="w-4 h-4 ml-1 opacity-60" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Portal to document.body to escape ancestor transforms that break fixed positioning
  return createPortal(content, document.body);
});

/* ─── Spec item sub-component ─── */
function SpecItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-muted/20 border border-border/10 px-3 py-2.5">
      <Icon className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-primary" : "text-muted-foreground/60"}`} />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-light tracking-wide">{label}</p>
        <p className={`text-sm font-medium truncate capitalize ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default QuickPreviewSheet;
