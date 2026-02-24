/**
 * Fullscreen photo gallery with swipe gestures, keyboard nav, and zoom
 */
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
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
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (next: number) => {
      if (zoomed) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, zoomed]
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
      if (zoomed) return;
      if (info.offset.x > SWIPE_THRESHOLD) goPrev();
      else if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    },
    [goPrev, goNext, zoomed]
  );

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
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-white/70 text-sm font-medium">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={zoomed ? "Dézoomer" : "Zoomer"}
          >
            {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag={zoomed ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className={cn(
              "absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing",
              zoomed && "cursor-zoom-out"
            )}
            onClick={() => zoomed && setZoomed(false)}
          >
            <img
              src={images[index]}
              alt={`${alt} – photo ${index + 1}`}
              className={cn(
                "max-h-full max-w-full object-contain select-none transition-transform duration-300",
                zoomed ? "scale-[1.8]" : "scale-100"
              )}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Desktop arrows */}
        {images.length > 1 && !zoomed && (
          <>
            <button
              onClick={goPrev}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom thumbnail strip */}
      {images.length > 1 && (
        <div className="relative z-10 px-4 py-3 sm:px-6">
          <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  i === index
                    ? "border-white ring-1 ring-white/30 scale-105"
                    : "border-transparent opacity-50 hover:opacity-80"
                )}
              >
                <img
                  src={img}
                  alt={`Miniature ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default FullscreenGallery;
