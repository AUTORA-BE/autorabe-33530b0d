/**
 * Reusable car image component with blur-up placeholder, skeleton loading,
 * error handling, and LCP optimization.
 * @module components/cars
 */

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Tiny 1×1 transparent SVG used as a base for the blur placeholder */
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM4ODgiLz48L3N2Zz4=";

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
 * CarImage displays a vehicle image with a blur-up placeholder transition,
 * error fallback, optional "Photo principale" badge, and LCP optimization.
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
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => setIsLoaded(true), []);
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // Handle already-cached images (complete before onLoad fires)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

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
      {/* Blur placeholder layer — visible until real image loads */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 skeleton-shimmer"
          style={{
            backgroundImage: `url(${BLUR_PLACEHOLDER})`,
            backgroundSize: "cover",
            filter: "blur(20px)",
            transform: "scale(1.1)",
          }}
        />
      )}

      {/* Error fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs font-medium">Image non disponible</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={800}
          height={600}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding={eager ? "sync" : "async"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500 ease-out",
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
