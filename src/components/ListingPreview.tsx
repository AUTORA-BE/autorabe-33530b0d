/**
 * Live preview du VehicleCard pendant la création d'annonce.
 * Affiche un aperçu temps réel + un score de qualité de l'annonce.
 *
 * @module components/ListingPreview
 */

import { memo, useMemo } from "react";
import { Heart, MapPin, Calendar, Gauge, CheckCircle, Leaf, AlertTriangle, Ban, Info, Building2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculerStatutLEZ } from "@/lib/lezData";

interface ListingPreviewData {
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  fuel_type?: string;
  euro_norm?: string;
  location?: string;
  seller_type?: string;
  car_pass_verified?: boolean;
  description?: string;
  vin?: string;
  ct_valid?: boolean;
  maintenance_book_complete?: boolean;
  power?: number;
}

interface ListingPreviewProps {
  /** Données du formulaire en temps réel */
  data: ListingPreviewData;
  /** Première photo uploadée (preview URL) */
  photoPreview?: string;
  /** Nombre de photos uploadées */
  photoCount: number;
}

/** Formatte un prix en EUR belge */
const formatPrice = (price: number): string =>
  new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);

/** Formatte le kilométrage */
const formatMileage = (km: number): string =>
  new Intl.NumberFormat("fr-BE").format(km);

const lezBadgeConfig = {
  autorise: { text: "LEZ OK", className: "bg-primary/90 text-primary-foreground border-0", Icon: Leaf },
  alerte: { text: "LEZ ⚠", className: "bg-amber-500/90 text-white border-0", Icon: AlertTriangle },
  derogation_requise: { text: "Dérogation", className: "bg-amber-500/90 text-white border-0", Icon: AlertTriangle },
  interdit: { text: "Interdit LEZ", className: "bg-red-500/90 text-white border-0", Icon: Ban },
  inconnu: { text: "LEZ ?", className: "bg-muted text-muted-foreground border-0", Icon: Info },
} as const;

/** Calcule le score de qualité de l'annonce (0–100) */
function computeAdQuality(data: ListingPreviewData, photoCount: number): { score: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  // Infos de base (40 pts)
  if (data.brand) score += 8; else tips.push("Ajoutez la marque");
  if (data.model) score += 8; else tips.push("Ajoutez le modèle");
  if (data.price && data.price > 0) score += 8; else tips.push("Indiquez le prix");
  if (data.year) score += 8;
  if (data.mileage !== undefined && data.mileage >= 0) score += 8;

  // Photos (25 pts)
  if (photoCount >= 5) score += 25;
  else if (photoCount >= 3) score += 18;
  else if (photoCount >= 1) score += 10;
  else tips.push("Ajoutez au moins 3 photos");

  // Description (10 pts)
  if (data.description && data.description.length >= 100) score += 10;
  else if (data.description && data.description.length >= 30) score += 5;
  else tips.push("Rédigez une description détaillée (+100 car.)");

  // Documents & confiance (25 pts)
  if (data.vin && data.vin.length === 17) score += 8; else tips.push("Ajoutez le VIN pour plus de confiance");
  if (data.car_pass_verified) score += 7;
  if (data.ct_valid) score += 5;
  if (data.maintenance_book_complete) score += 5;

  return { score: Math.min(score, 100), tips: tips.slice(0, 3) };
}

/**
 * Aperçu temps réel de l'annonce en cours de création
 */
const ListingPreview = memo(function ListingPreview({ data, photoPreview, photoCount }: ListingPreviewProps) {
  const lezResult = data.fuel_type && data.euro_norm
    ? calculerStatutLEZ(data.fuel_type, data.euro_norm)
    : null;

  const lezConfig = lezResult ? lezBadgeConfig[lezResult.global.statut] : null;

  const { score, tips } = useMemo(
    () => computeAdQuality(data, photoCount),
    [data, photoCount],
  );

  const scoreColor = score >= 80
    ? "text-primary"
    : score >= 50
      ? "text-amber-500"
      : "text-muted-foreground";

  const progressColor = score >= 80
    ? "[&>div]:bg-primary"
    : score >= 50
      ? "[&>div]:bg-amber-500"
      : "[&>div]:bg-muted-foreground";

  const hasMinData = !!(data.brand || data.model || data.price);

  return (
    <div className="space-y-4">
      {/* Titre section */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Eye className="w-4 h-4" />
        Aperçu de votre annonce
      </div>

      {/* Card preview */}
      <article className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs">Ajoutez des photos</span>
            </div>
          )}

          {/* Favorite button (decorative) */}
          <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* LEZ & CarPass badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {lezConfig && (
              <Badge className={`${lezConfig.className} backdrop-blur-sm shadow-lg`}>
                <lezConfig.Icon className="w-3 h-3 mr-1" />
                {lezResult?.global.statut === "alerte"
                  ? `LEZ ${lezResult.global.anneeInterdiction}`
                  : lezConfig.text}
              </Badge>
            )}
            {data.car_pass_verified && (
              <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm shadow-lg">
                <CheckCircle className="w-3 h-3 mr-1" />
                Car-Pass vérifié
              </Badge>
            )}
          </div>

          {/* Price */}
          {data.price && data.price > 0 && (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="text-xl font-bold text-white drop-shadow-lg">
                {formatPrice(data.price)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-lg font-bold text-foreground line-clamp-1">
              {hasMinData
                ? `${data.brand || "Marque"} ${data.model || "Modèle"}`
                : "Votre véhicule"}
            </h3>
            {data.seller_type === "professionnel" && (
              <Badge className="bg-primary/10 text-primary border-0 shrink-0 ml-2">
                <Building2 className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>

          {data.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{data.location}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {data.year && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
                <span>{data.year}</span>
              </div>
            )}
            {data.mileage !== undefined && data.mileage >= 0 && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Gauge className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
                <span className="truncate">{formatMileage(data.mileage)} km</span>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Ad Quality Score */}
      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Qualité de l'annonce</span>
          <span className={`text-lg font-bold ${scoreColor}`}>{score}%</span>
        </div>
        <Progress value={score} className={`h-2 ${progressColor}`} />
        {tips.length > 0 && (
          <ul className="space-y-1">
            {tips.map((tip) => (
              <li key={tip} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
        {score >= 80 && (
          <p className="text-xs text-primary font-medium">
            ✨ Excellente annonce ! Elle attirera plus d'acheteurs.
          </p>
        )}
      </div>
    </div>
  );
});

export default ListingPreview;
