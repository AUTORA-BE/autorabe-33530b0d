import { forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { Fuel, Calendar, Gauge, Shield, MapPin, Heart, GitCompareArrows } from "lucide-react";
import { useCompareContext } from "@/features/compare";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { toast } from "sonner";
import { calculerStatutLEZ } from "@/lib/lezData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Vehicle } from "../types/vehicle.types";

/**
 * Props for the CarCard component
 */
export interface CarCardProps {
  /** Vehicle data to display */
  car: Vehicle;
  /** Whether this car is in user's favorites */
  isFavorite?: boolean;
  /** Callback when favorite button is clicked */
  onToggleFavorite?: (carId: string) => void;
  /** Callback when card is clicked */
  onClick?: (carId: string) => void;
}

/**
 * Get LEZ badge configuration using centralized LEZ calendar
 */
const getLezBadgeInfo = (euroNorm: string, fuelType: string) => {
  if (!euroNorm || !fuelType) return null;

  const result = calculerStatutLEZ(fuelType, euroNorm);
  const s = result.global;

  switch (s.statut) {
    case "autorise":
      return {
        text: "LEZ OK",
        color: "bg-primary/15 text-primary",
        details: result.details,
      };
    case "alerte":
      return {
        text: `LEZ ${s.anneeInterdiction}`,
        color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        details: result.details,
      };
    case "derogation_requise":
      return {
        text: "Dérogation",
        color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        details: result.details,
      };
    case "interdit":
      return {
        text: "LEZ Interdit",
        color: "bg-red-500/15 text-red-600 dark:text-red-400",
        details: result.details,
      };
    default:
      return null;
  }
};

/**
 * Card component for displaying a vehicle in a grid or list
 * Includes favorite toggle, compare functionality, and LEZ badges
 */
const CarCard = memo(forwardRef<HTMLElement, CarCardProps>(({ car, isFavorite = false, onToggleFavorite, onClick }, ref) => {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompareContext();
  const { t, language } = useLanguage();
  const { impactLight, notificationSuccess, selectionChanged } = useHapticFeedback();

  // Generate multilingual alt text for SEO
  const getAltText = () => {
    const yearText = car.year;
    const mileageFormatted = new Intl.NumberFormat(language === "nl" ? "nl-BE" : "fr-BE").format(car.mileage);
    
    switch (language) {
      case "nl":
        return `${car.brand} ${car.model} ${yearText} - ${mileageFormatted} km - ${car.fuelType} - Te koop in ${car.location}`;
      case "de":
        return `${car.brand} ${car.model} ${yearText} - ${mileageFormatted} km - ${car.fuelType} - Zu verkaufen in ${car.location}`;
      case "en":
        return `${car.brand} ${car.model} ${yearText} - ${mileageFormatted} km - ${car.fuelType} - For sale in ${car.location}`;
      default:
        return `${car.brand} ${car.model} ${yearText} - ${mileageFormatted} km - ${car.fuelType} - À vendre à ${car.location}`;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "nl" ? "nl-BE" : language === "en" ? "en-BE" : "fr-BE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat(language === "nl" ? "nl-BE" : language === "en" ? "en-BE" : "fr-BE").format(km) + " km";
  };

  const handleClick = () => {
    impactLight();
    if (onClick) {
      onClick(car.id);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectionChanged();
    if (onToggleFavorite) {
      onToggleFavorite(car.id);
    }
  };

  const inCompare = isInCompare(car.id);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(car.id);
      selectionChanged();
      toast.info(t("car.removedCompare"));
    } else if (canAddMore) {
      addToCompare(car);
      notificationSuccess();
      toast.success(t("car.addedCompare"));
    } else {
      toast.warning(t("car.maxCompare"));
    }
  };

  const lezBadge = getLezBadgeInfo(car.euroNorm, car.fuelType);

  return (
    <motion.article
      ref={ref as React.Ref<HTMLElement>}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-2xl overflow-hidden bg-card border border-border/50 group cursor-pointer touch-target"
      style={{
        boxShadow: "var(--shadow-card)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-elevated)";
        e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.borderColor = "";
      }}
      onClick={handleClick}
    >
      <div className="relative h-48 md:h-56 overflow-hidden">
        <motion.img
          src={car.image}
          alt={getAltText()}
          loading="lazy"
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button
            onClick={handleFavoriteClick}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg touch-target focus-ring ${
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-red-500"
            }`}
            aria-label={isFavorite ? t("car.removeFromFavorites") : t("car.addToFavorites")}
          >
            <motion.div
              animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </motion.div>
          </motion.button>
          <motion.button
            onClick={handleCompareClick}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg touch-target focus-ring ${
              inCompare
                ? "bg-primary text-primary-foreground"
                : "bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-primary"
            }`}
            title={inCompare ? t("car.removeCompare") : t("car.addCompare")}
            aria-label={inCompare ? t("car.removeCompare") : t("car.addCompare")}
          >
            <GitCompareArrows className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {lezBadge && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-help ${lezBadge.color}`}>
                    <Shield className="w-3 h-3" />
                    {lezBadge.text}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs p-3">
                  <p className="font-semibold text-xs mb-2">Compatibilité LEZ :</p>
                  <div className="space-y-1.5">
                    {lezBadge.details.map((d) => (
                      <div key={d.ville} className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          d.couleur === "green" ? "bg-primary" :
                          d.couleur === "orange" ? "bg-amber-500" :
                          d.couleur === "red" ? "bg-red-500" : "bg-muted-foreground"
                        }`} />
                        <span className="capitalize font-medium">{d.ville}</span>
                        <span className="text-muted-foreground">{d.message}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {car.hasCarPass && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold bg-background/90 backdrop-blur-sm text-foreground shadow-sm">
              <Shield className="w-3 h-3 text-primary" />
              Car-Pass
            </span>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3">
          <motion.span
            className="inline-block px-3 py-2 rounded-2xl bg-background/95 backdrop-blur-sm font-display text-lg font-bold text-foreground"
            style={{ boxShadow: "0 2px 12px -2px hsl(var(--foreground) / 0.1)" }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {formatPrice(car.price)}
          </motion.span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
          {car.brand} {car.model}
        </h3>

        {/* Location */}
        <p className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <MapPin className="w-3 h-3" />
          {car.location}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-secondary text-sm text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
            <Calendar className="w-3.5 h-3.5" />
            {car.year}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-secondary text-sm text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
            <Gauge className="w-3.5 h-3.5" />
            {formatMileage(car.mileage)}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-secondary text-sm text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
            <Fuel className="w-3.5 h-3.5" />
            {car.fuelType}
          </span>
        </div>
      </div>
    </motion.article>
  );
}));

CarCard.displayName = "CarCard";

export default CarCard;
