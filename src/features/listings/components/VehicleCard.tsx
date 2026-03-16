/**
 * VehicleCard component for displaying a vehicle listing
 * @module features/listings/components
 */

import { memo, useMemo } from "react";
import { Heart, MapPin, Calendar, Gauge, Shield, CheckCircle, AlertTriangle, Ban, Leaf, Info, Building2, Sparkles, Scale } from "lucide-react";
import { useCompareContext } from "@/features/compare";
import CarImage from "@/components/cars/CarImage";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculerStatutLEZ } from "@/lib/lezData";
import type { Vehicle } from "../types/vehicle.types";
import { computeMatchScore } from "@/features/tco/utils/matchScore";
import type { BuyerProfile } from "@/features/tco/hooks/useBuyerProfile";

/**
 * Props for the VehicleCard component
 */
export interface VehicleCardProps {
  /** Vehicle data to display */
  vehicle: Vehicle;
  /** Whether this vehicle is in the user's favorites */
  isFavorite?: boolean;
  /** Callback when favorite button is clicked */
  onToggleFavorite?: (vehicleId: string) => void;
  /** Callback when the card is clicked */
  onClick?: (vehicleId: string) => void;
  /** Whether to eager-load the image (for LCP) */
  eager?: boolean;
  /** Profil acheteur pour le TCO Matchmaker (optionnel) */
  buyerProfile?: BuyerProfile | null;
}

/**
 * Formats a number as currency in EUR
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Formats mileage with thousand separators
 */
const formatMileage = (km: number): string => {
  return new Intl.NumberFormat("fr-BE").format(km);
};

const lezBadgeConfig = {
  autorise: { text: "LEZ OK", className: "bg-primary/90 hover:bg-primary text-primary-foreground border-0", Icon: Leaf },
  alerte: { text: "LEZ", className: "bg-amber-500/90 hover:bg-amber-500 text-white border-0", Icon: AlertTriangle },
  derogation_requise: { text: "Dérogation", className: "bg-amber-500/90 hover:bg-amber-500 text-white border-0", Icon: AlertTriangle },
  interdit: { text: "Interdit", className: "bg-red-500/90 hover:bg-red-500 text-white border-0", Icon: Ban },
  inconnu: { text: "LEZ ?", className: "bg-muted text-muted-foreground border-0", Icon: Info },
} as const;

/**
 * VehicleCard displays a single vehicle listing in a card format
 * Includes image, price, specs, and LEZ/CarPass badges
 */
const VehicleCard = memo(function VehicleCard({
  vehicle,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  eager = false,
  buyerProfile,
}: VehicleCardProps) {
  const { addToCompare, removeFromCompare: removeCompare, isInCompare } = useCompareContext();
  const { language } = useLanguage();
  const lezResult = calculerStatutLEZ(vehicle.fuelType, vehicle.euroNorm);
  const lezConfig = lezBadgeConfig[lezResult.global.statut];

  // TCO Matchmaker score
  const matchResult = useMemo(
    () => buyerProfile?.isConfigured ? computeMatchScore(vehicle, buyerProfile) : null,
    [vehicle, buyerProfile],
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(vehicle.id);
  };

  const handleCardClick = () => {
    onClick?.(vehicle.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCompare(vehicle.id)) {
      removeCompare(vehicle.id);
    } else {
      addToCompare(vehicle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(vehicle.id);
    }
  };

  const labels = {
    carPass: "Car-Pass",
    km: "km",
  };

  const badgeText = lezResult.global.statut === "alerte"
    ? `LEZ ${lezResult.global.anneeInterdiction}`
    : lezConfig.text;

  const isBoosted = vehicle.isBoosted;

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${vehicle.brand} ${vehicle.model} - ${formatPrice(vehicle.price)}`}
      className={`group relative bg-card rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isBoosted
          ? "border-amber-400/70 shadow-md hover:shadow-xl hover:border-amber-400"
          : "border-border/40 shadow-card hover:shadow-elevated hover:border-primary/20 hover:-translate-y-1"
      }`}
    >
      {/* Sponsored badge */}
      {isBoosted && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-gradient-to-l from-amber-500 to-amber-400 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sponsorisé
          </div>
        </div>
      )}
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <CarImage
          src={vehicle.image || "/placeholder.svg"}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          aspectRatio="4/3"
          eager={eager}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg touch-manipulation z-10"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-red-500"
            }`}
          />
        </button>

        {/* Compare Button */}
        <button
          onClick={handleCompareClick}
          aria-label={isInCompare(vehicle.id) ? "Retirer du comparateur" : "Ajouter au comparateur"}
          className={`absolute top-3 right-14 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg touch-manipulation z-10 ${
            isInCompare(vehicle.id)
              ? "bg-primary text-primary-foreground"
              : "bg-white/90 dark:bg-black/50 text-muted-foreground hover:text-primary"
          }`}
        >
          <Scale className="w-5 h-5" />
        </button>

        {/* LEZ & CarPass Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge className={`${lezConfig.className} backdrop-blur-sm shadow-lg cursor-help`}>
                    <lezConfig.Icon className="w-3 h-3 mr-1" />
                    {badgeText}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <p className="font-semibold text-sm mb-2">Compatibilité LEZ</p>
                <div className="space-y-1.5">
                  {lezResult.details.map((d) => (
                    <div key={d.ville} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        d.couleur === "green" ? "bg-primary" :
                        d.couleur === "orange" ? "bg-amber-500" :
                        d.couleur === "red" ? "bg-red-500" : "bg-muted-foreground"
                      }`} />
                      <span className="font-medium capitalize">{d.ville}</span>
                      <span className="text-muted-foreground ml-auto">{d.message}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {vehicle.hasCarPass && (
            <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground border-0 backdrop-blur-sm shadow-lg">
              <CheckCircle className="w-3 h-3 mr-1" />
              {labels.carPass}
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
            {formatPrice(vehicle.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Title */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {vehicle.brand} {vehicle.model}
          </h3>
          {vehicle.sellerType === "professionnel" && (
            <Badge className="bg-primary/10 text-primary border-0 shrink-0 ml-2 text-[10px] sm:text-xs">
              <Building2 className="w-3 h-3 mr-0.5 sm:mr-1" />
              Pro
            </Badge>
          )}
        </div>

        {/* Location */}
        {vehicle.location && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{vehicle.location}</span>
          </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Gauge className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
            <span className="truncate">{formatMileage(vehicle.mileage)} {labels.km}</span>
          </div>
        </div>

        {/* TCO Match Score */}
        {matchResult && (
          <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
            matchResult.color === "primary"
              ? "bg-primary/10 text-primary"
              : matchResult.color === "amber"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
          }`}>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {matchResult.label}
            </span>
            <span className="font-bold">{matchResult.score}%</span>
          </div>
        )}
      </div>
    </article>
  );
});

export default VehicleCard;
