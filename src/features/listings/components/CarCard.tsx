import { forwardRef, memo } from "react";
import { Fuel, Calendar, Gauge, MapPin, Heart, GitCompareArrows, Leaf, AlertTriangle, Ban, Info, CheckCircle } from "lucide-react";
import { useCompareContext } from "@/features/compare";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { toast } from "sonner";
import { calculerStatutLEZ } from "@/lib/lezData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "../types/vehicle.types";

export interface CarCardProps {
  car: Vehicle;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string) => void;
  onClick?: (carId: string) => void;
}

const lezBadgeConfig = {
  autorise: { text: "LEZ OK", className: "bg-primary/90 hover:bg-primary text-primary-foreground border-0", Icon: Leaf },
  alerte: { text: "LEZ", className: "bg-amber-500/90 hover:bg-amber-500 text-white border-0", Icon: AlertTriangle },
  derogation_requise: { text: "Dérogation", className: "bg-amber-500/90 hover:bg-amber-500 text-white border-0", Icon: AlertTriangle },
  interdit: { text: "Interdit", className: "bg-red-500/90 hover:bg-red-500 text-white border-0", Icon: Ban },
  inconnu: { text: "LEZ ?", className: "bg-muted text-muted-foreground border-0", Icon: Info },
} as const;

const getLezBadgeInfo = (euroNorm: string, fuelType: string) => {
  if (!euroNorm || !fuelType) return null;
  const result = calculerStatutLEZ(fuelType, euroNorm);
  const config = lezBadgeConfig[result.global.statut];
  const badgeText = result.global.statut === "alerte"
    ? `LEZ ${result.global.anneeInterdiction}`
    : config.text;
  return { config, badgeText, details: result.details };
};

const CarCard = memo(forwardRef<HTMLElement, CarCardProps>(({ car, isFavorite = false, onToggleFavorite, onClick }, ref) => {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompareContext();
  const { t, language } = useLanguage();
  const { impactLight, notificationSuccess, selectionChanged } = useHapticFeedback();

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
    if (onClick) onClick(car.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectionChanged();
    if (onToggleFavorite) onToggleFavorite(car.id);
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
    <article
      ref={ref as React.Ref<HTMLElement>}
      className="rounded-2xl overflow-hidden bg-card border border-border/50 group cursor-pointer touch-target transition-all duration-300 hover:-translate-y-2 active:scale-[0.97]"
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
        <img
          src={car.image}
          alt={getAltText()}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-[1.08]"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg touch-target focus-ring active:scale-[0.85] ${
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-red-500"
            }`}
            aria-label={isFavorite ? t("car.removeFromFavorites") : t("car.addToFavorites")}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={handleCompareClick}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg touch-target focus-ring active:scale-[0.85] ${
              inCompare
                ? "bg-primary text-primary-foreground"
                : "bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-primary"
            }`}
            title={inCompare ? t("car.removeCompare") : t("car.addCompare")}
            aria-label={inCompare ? t("car.removeCompare") : t("car.addCompare")}
          >
            <GitCompareArrows className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {lezBadge && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Badge className={`${lezBadge.config.className} backdrop-blur-sm shadow-lg cursor-help`}>
                      <lezBadge.config.Icon className="w-3 h-3 mr-1" />
                      {lezBadge.badgeText}
                    </Badge>
                  </div>
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
            <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground border-0 backdrop-blur-sm shadow-lg">
              <CheckCircle className="w-3 h-3 mr-1" />
              Car-Pass
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3">
          <span
            className="inline-block px-3 py-2 rounded-2xl bg-background/95 backdrop-blur-sm font-display text-lg font-bold text-foreground transition-transform duration-200 hover:scale-105"
            style={{ boxShadow: "0 2px 12px -2px hsl(var(--foreground) / 0.1)" }}
          >
            {formatPrice(car.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
          {car.brand} {car.model}
        </h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <MapPin className="w-3 h-3" />
          {car.location}
        </p>
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
    </article>
  );
}));

CarCard.displayName = "CarCard";

export default CarCard;
