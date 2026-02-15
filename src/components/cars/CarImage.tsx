/**
 * Reusable car image component with skeleton loading, error handling, and LCP optimization
 * @module components/cars
 */

import { memo, useState, useCallback } from "react";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CarImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Show "Photo principale" badge */
  isPrimary?: boolean;
  /** Use eager loading for LCP-critical images */
  eager?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio CSS value (default: "4/3") */
  aspectRatio?: string;
  /** Click handler (e.g. for zoom/fullscreen) */
  onClick?: () => void;
}

/**
 * CarImage displays a vehicle image with skeleton loader,
 * error fallback, optional "Photo principale" badge, and LCP optimization
 */
const CarImage = memo(function CarImage({
  src,
  alt,
  isPrimary = false,
  eager = false,
  className,
  aspectRatio = "4/3",
  onClick,
}: CarImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => setIsLoaded(true), []);
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        onClick && "cursor-pointer",
        className
      )}
      style={{ aspectRatio }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Error fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs font-medium">Image non disponible</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Primary badge */}
      {isPrimary && isLoaded && !hasError && (
        <Badge className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground border-0 text-xs backdrop-blur-sm">
          Photo principale
        </Badge>
      )}
    </div>
  );
});

export default CarImage;
