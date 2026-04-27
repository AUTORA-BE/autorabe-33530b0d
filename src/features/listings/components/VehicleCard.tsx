/**
 * VehicleCard component — luxe redesign with larger image, premium badges, refined hierarchy
 * @module features/listings/components
 */

import { memo, useMemo } from "react";
import {   Heart, MapPin, Calendar, Gauge, AlertTriangle, Ban, Leaf, Info, Building2, Sparkles, Scale, Fuel, Cog, Zap, ShieldCheck } from "lucide-react";
import { useCompareContext } from "@/features/compare";
import CarImage from "@/components/cars/CarImage";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculerStatutLEZ } from "@/lib/lezData";
import type { Vehicle } from "../types/vehicle.types";
import { computeMatchScore } from "@/features/tco/utils/matchScore";
import type { BuyerProfile } from "@/features/tco/hooks/useBuyerProfile";

export interface VehicleCardProps {
  vehicle: Vehicle;
  isFavorite?: boolean;
  onToggleFavorite?: (vehicleId: string) => void;
  onClick?: (vehicleId: string) => void;
  eager?: boolean;
  buyerProfile?: BuyerProfile | null;
  favoriteCount?: number;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

const mileageFormatter = new Intl.NumberFormat("fr-BE");
const formatMileage = (km: number): string => mileageFormatter.format(km);

const lezBadgeConfig = {
  autorise: { text: "LEZ OK", className: "bg-emerald-500/90 text-white border-0", Icon: Leaf },
  alerte: { text: "LEZ", className: "bg-amber-500/90 text-white border-0", Icon: AlertTriangle },
  derogation_requise: { text: "Dérogation", className: "bg-amber-500/90 text-white border-0", Icon: AlertTriangle },
  interdit: { text: "Interdit", className: "bg-red-500/90 text-white border-0", Icon: Ban },
  inconnu: { text: "LEZ ?", className: "bg-muted text-muted-foreground border-0", Icon: Info },
} as const;

const VehicleCard = memo(function VehicleCard({
  vehicle,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  eager = false,
  buyerProfile,
  favoriteCount,
}: VehicleCardProps) {
  const { addToCompare, removeFromCompare: removeCompare, isInCompare } = useCompareContext();
  const {  } = useLanguage();
  const lezResult = calculerStatutLEZ(vehicle.fuelType, vehicle.euroNorm);
  const lezConfig = lezBadgeConfig[lezResult.global.statut];

  const matchResult = useMemo(
    () => buyerProfile?.isConfigured ? computeMatchScore(vehicle, buyerProfile) : null,
    [vehicle, buyerProfile],
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(vehicle.id);
  };

  const handleCardClick = () => onClick?.(vehicle.id);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    isInCompare(vehicle.id) ? removeCompare(vehicle.id) : addToCompare(vehicle);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(vehicle.id); }
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
      className={`group relative bg-card rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 ${
        isBoosted
          ? "border-amber-400/50 shadow-md hover:shadow-xl"
          : "border-border/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/15"
      }`}
    >
      {/* Sponsored badge */}
      {isBoosted && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-gradient-to-l from-amber-500 to-amber-400 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Sponsorisé
          </div>
        </div>
      )}

      {/* Image — taller aspect ratio for more visual impact */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <CarImage
          src={vehicle.image || "/placeholder.svg"}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          aspectRatio="4/3"
          eager={eager}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Subtle gradient overlay — always visible for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 shadow-lg touch-manipulation z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-foreground/70"
            }`}
          />
        </button>

        {/* Compare button */}
        <button
          onClick={handleCompareClick}
          aria-label={isInCompare(vehicle.id) ? "Retirer du comparateur" : "Ajouter au comparateur"}
          className={`absolute top-2.5 right-12 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 shadow-lg touch-manipulation z-10 ${
            isInCompare(vehicle.id)
              ? "bg-primary text-primary-foreground"
              : "bg-background/70 text-foreground/70"
          }`}
        >
          <Scale className="w-4 h-4" />
        </button>

        {/* Premium trust badges — top left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge className={`${lezConfig.className} backdrop-blur-md shadow-lg text-[10px] font-semibold px-2 py-0.5`}>
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
                        d.couleur === "green" ? "bg-emerald-500" :
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
            <Badge className="bg-primary/90 text-primary-foreground border-0 backdrop-blur-md shadow-lg text-[10px] font-semibold px-2 py-0.5">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Car-Pass ✓
            </Badge>
          )}
        </div>

        {/* Price overlay — bottom left on image for visual impact */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-end gap-2">
          <span className="text-lg sm:text-xl font-bold text-white drop-shadow-lg tracking-tight">
            {formatPrice(vehicle.price)}
          </span>
          {typeof favoriteCount === "number" && favoriteCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-md text-[10px] text-white/90 font-medium">
              <Heart className="w-2.5 h-2.5 fill-red-400 text-red-400" />
              {favoriteCount}
            </span>
          )}
        </div>
      </div>

      {/* Content — refined spacing */}
      <div className="p-3 sm:p-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {vehicle.brand} {vehicle.model}
          </h3>
          {vehicle.sellerType === "professionnel" && (
            <Badge variant="outline" className="text-primary border-primary/20 text-[9px] font-semibold px-1.5 py-0 h-5 ml-2 shrink-0">
              <Building2 className="w-2.5 h-2.5 mr-0.5" />
              Pro
            </Badge>
          )}
        </div>

        {/* Location */}
        {vehicle.location && (
          <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
            <span className="line-clamp-1">{vehicle.location}</span>
          </div>
        )}

        {/* Specs — compact 2-col grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {[
            { icon: Calendar, value: vehicle.year },
            { icon: Gauge, value: `${formatMileage(vehicle.mileage)} km` },
            { icon: Fuel, value: vehicle.fuelType },
            { icon: Cog, value: vehicle.transmission },
            ...('power' in vehicle && (vehicle as Record<string, unknown>).power ? [{ icon: Zap, value: `${(vehicle as Record<string, unknown>).power} CV` }] : []),
            ...(vehicle.euroNorm ? [{ icon: ShieldCheck, value: vehicle.euroNorm }] : []),
          ].map((spec, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <spec.icon className="w-3 h-3 flex-shrink-0 text-primary/50" strokeWidth={1.5} />
              <span className="truncate capitalize">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* TCO Match Score */}
        {matchResult && (
          <div className={`mt-2.5 flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-medium ${
            matchResult.color === "primary"
              ? "bg-primary/8 text-primary"
              : matchResult.color === "amber"
                ? "bg-amber-500/8 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
          }`}>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
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
