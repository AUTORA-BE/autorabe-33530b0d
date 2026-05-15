/**
 * Fullscreen photo gallery with swipe gestures, keyboard nav, and pinch-to-zoom
 */
import { memo, useState, useCallback, useEffect, useRef } from "react";
import {  motion, AnimatePresence, type PanInfo, useMotionValue } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullscreenGalleryProps {
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 50;

const FullscreenGallery = memo(function FullscreenGallery({
  images,
  initialIndex,
  alt,
  onClose,
}: FullscreenGalleryProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  // Pinch-to-zoom state
  const scale = useMotionValue(1);
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const lastTap = useRef(0);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const imgRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    scale.set(1);
    offsetX.set(0);
    offsetY.set(0);
    setIsZoomed(false);
  }, [scale, offsetX, offsetY]);

  const goTo = useCallback(
    (next: number) => {
      if (isZoomed) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, isZoomed]
  );

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    goTo(index === 0 ? images.length - 1 : index - 1);
  }, [goTo, index, images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    goTo(index === images.length - 1 ? 0 : index + 1);
  }, [goTo, index, images.length]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (isZoomed) return;
      if (info.offset.x > SWIPE_THRESHOLD) goPrev();
      else if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    },
    [goPrev, goNext, isZoomed]
  );

  // Double-tap to zoom
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (isZoomed) {
        resetZoom();
      } else {
        scale.set(2.5);
        setIsZoomed(true);
      }
    }
    lastTap.current = now;
  }, [isZoomed, resetZoom, scale]);

  // Touch pinch handlers
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance.current = Math.hypot(dx, dy);
        initialScale.current = scale.get();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const newScale = Math.min(Math.max(initialScale.current * (dist / initialDistance.current), 1), 4);
        scale.set(newScale);
        setIsZoomed(newScale > 1.1);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && scale.get() <= 1.1) {
        resetZoom();
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scale, resetZoom]);

  // Reset zoom on index change
  useEffect(() => { resetZoom(); }, [index, resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6 safe-top">
        <span className="text-white/70 text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image area */}
      <div ref={imgRef} className="flex-1 relative overflow-hidden flex items-center justify-center touch-none">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag={isZoomed ? "x" : "x"}
            dragConstraints={isZoomed ? { left: -200, right: 200, top: -200, bottom: 200 } : { left: 0, right: 0 }}
            dragElastic={isZoomed ? 0.05 : 0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex items-center justify-center"
            onClick={handleTap}
            style={isZoomed ? { x: offsetX, y: offsetY } : undefined}
          >
            <motion.img
              src={images[index]}
              alt={`${alt} – photo ${index + 1}`}
              className="max-h-full max-w-full object-contain select-none"
              style={{ scale }}
              draggable={false}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=60";
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint on mobile */}
        {!isZoomed && (
          <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-xs font-medium pointer-events-none">
            Pincez pour zoomer
          </div>
        )}

        {/* Desktop arrows */}
        {images.length > 1 && !isZoomed && (
          <>
            <button onClick={goPrev}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              aria-label="Photo précédente">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={goNext}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              aria-label="Photo suivante">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators (mobile) + thumbnails (desktop) */}
      {images.length > 1 && (
        <div className="relative z-10 px-4 py-3 sm:px-6 safe-bottom">
          {/* Mobile dots */}
          <div className="flex sm:hidden gap-1.5 justify-center">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === index ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"
                )}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
          {/* Desktop thumbnails */}
          <div className="hidden sm:flex gap-2 justify-center overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={cn(
                  "flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  i === index ? "border-white ring-1 ring-white/30 scale-105" : "border-transparent opacity-50 hover:opacity-80"
                )}>
                <img src={img} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" loading="lazy" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default FullscreenGallery;
