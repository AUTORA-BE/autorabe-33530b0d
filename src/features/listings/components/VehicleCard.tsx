/**
 * VehicleCard component for displaying a vehicle listing
 * @module features/listings/components
 */

import { memo } from "react";
import { Heart, MapPin, Fuel, Calendar, Gauge, Shield, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Vehicle } from "../types/vehicle.types";

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

/**
 * VehicleCard displays a single vehicle listing in a card format
 * Includes image, price, specs, and LEZ/CarPass badges
 */
const VehicleCard = memo(function VehicleCard({
  vehicle,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: VehicleCardProps) {
  const { language } = useLanguage();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(vehicle.id);
  };

  const handleCardClick = () => {
    onClick?.(vehicle.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(vehicle.id);
    }
  };

  // Localized labels
  const labels = {
    lez: language === "nl" ? "LEZ OK" : "LEZ OK",
    carPass: language === "nl" ? "Car-Pass" : "Car-Pass",
    km: "km",
  };

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${vehicle.brand} ${vehicle.model} - ${formatPrice(vehicle.price)}`}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={vehicle.image || "/placeholder.svg"}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        {/* LEZ & CarPass Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {vehicle.isLezCompatible && (
            <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-0 backdrop-blur-sm shadow-lg">
              <Shield className="w-3 h-3 mr-1" />
              {labels.lez}
            </Badge>
          )}
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
      <div className="p-4">
        {/* Title */}
        <h3 className="font-display text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {vehicle.brand} {vehicle.model}
        </h3>

        {/* Location */}
        {vehicle.location && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{vehicle.location}</span>
          </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Gauge className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
            <span className="truncate">{formatMileage(vehicle.mileage)} {labels.km}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Fuel className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
            <span className="truncate capitalize">{vehicle.fuelType}</span>
          </div>
        </div>
      </div>
    </article>
  );
});

export default VehicleCard;
