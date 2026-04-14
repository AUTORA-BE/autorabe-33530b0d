import { useEffect, useRef, useCallback, useMemo } from "react";
import { CarCard, type Car } from "@/features/listings";
import { SlidersHorizontal, ChevronDown, AlertCircle, RefreshCw, Share2, Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { BuyerProfile } from "@/features/tco/hooks/useBuyerProfile";
import { useFavoriteCounts } from "@/features/favorites/hooks/useFavoriteCounts";

interface LoadMoreGridProps {
  cars: Car[];
  onOpenFilters: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  isFavorite: (carId: string) => boolean;
  onToggleFavorite: (carId: string) => void;
  onCarClick: (carId: string) => void;
  activeFiltersCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  totalCount: number;
  error?: string | null;
  onRetry?: () => void;
  /** Profil acheteur pour le TCO Matchmaker */
  buyerProfile?: BuyerProfile | null;
  /** Callback pour ouvrir le modal de profil */
  onOpenBuyerProfile?: () => void;
  /** Callback to reset all filters */
  onResetFilters?: () => void;
}

// Skeleton component for car cards with shimmer effect
const CarCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm animate-fade-in">
    {/* Image skeleton with shimmer */}
    <div className="aspect-[4/3] w-full skeleton-shimmer" />
    
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Brand and model */}
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
      </div>
      
      {/* Tags row */}
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        <div className="h-6 w-14 rounded-full skeleton-shimmer" />
      </div>
      
      {/* Price and location */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-20 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  </div>
);

const LoadMoreGrid = ({
  cars,
  onOpenFilters,
  sortBy,
  onSortChange,
  isFavorite,
  onToggleFavorite,
  onCarClick,
  activeFiltersCount,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  totalCount,
  error,
  onRetry,
  buyerProfile,
  onOpenBuyerProfile,
  onResetFilters,
}: LoadMoreGridProps) => {
  const { language } = useLanguage();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prevFiltersCount = useRef(activeFiltersCount);
  const listingIds = useMemo(() => cars.map(c => c.id), [cars]);
  const favCounts = useFavoriteCounts(listingIds);

  // Haptic feedback when filter count changes
  useEffect(() => {
    if (prevFiltersCount.current !== activeFiltersCount && activeFiltersCount > 0) {
      if (navigator.vibrate) navigator.vibrate(6);
    }
    prevFiltersCount.current = activeFiltersCount;
  }, [activeFiltersCount]);

  const sortOptions = [
    { value: "recent", label: language === "nl" ? "Meest recent" : "Plus récentes" },
    { value: "price-asc", label: language === "nl" ? "Prijs oplopend" : "Prix croissant" },
    { value: "price-desc", label: language === "nl" ? "Prijs aflopend" : "Prix décroissant" },
    { value: "year-desc", label: language === "nl" ? "Jaar aflopend" : "Année décroissante" },
    { value: "km-asc", label: language === "nl" ? "Km oplopend" : "Kilométrage croissant" },
  ];

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0,
      rootMargin: "400px",
    });
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Fallback: check on scroll if observer missed it
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    const element = loadMoreRef.current;
    if (!element) return;

    const checkVisibility = () => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight + 400) {
        onLoadMore();
      }
    };

    // Check immediately (element might already be near viewport)
    checkVisibility();

    window.addEventListener('scroll', checkVisibility, { passive: true });
    return () => window.removeEventListener('scroll', checkVisibility);
  }, [hasMore, isLoadingMore, onLoadMore]);

  const texts = {
    available: language === "nl" ? "Beschikbare voertuigen" : "Véhicules disponibles",
    showing: language === "nl" ? "op" : "sur",
    vehicles: language === "nl" ? "voertuigen" : "véhicules",
    filters: language === "nl" ? "Filters" : "Filtres",
    noVehicles: language === "nl" ? "Geen voertuigen gevonden" : "Aucun véhicule trouvé",
    noVehiclesDesc: language === "nl" 
      ? "Wijzig uw zoekcriteria om overeenkomende voertuigen te vinden." 
      : "Modifiez vos critères de recherche pour trouver des véhicules correspondants.",
    loadMore: language === "nl" ? "Meer laden" : "Charger plus",
    loading: language === "nl" ? "Laden..." : "Chargement...",
  };

  // Error state - inline since ErrorState component was removed
  if (error && !isLoading) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            {language === "nl" ? "Er is een fout opgetreden" : "Une erreur s'est produite"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {language === "nl" ? "Opnieuw proberen" : "Réessayer"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="h-8 w-48 rounded-xl skeleton-shimmer" />
          <div className="h-10 w-32 rounded-xl skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <CarCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">
            {texts.available}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-base">
            {cars.length} {texts.showing} {totalCount} {texts.vehicles}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {/* Mobile filter button */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              onOpenFilters();
            }}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium relative touch-manipulation flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {texts.filters}
            {activeFiltersCount > 0 && (
              <span
                key={activeFiltersCount}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center animate-badge-pop"
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Copy search link button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success(language === "nl" ? "Zoeklink gekopieerd!" : "Lien de recherche copié !");
                if (navigator.vibrate) navigator.vibrate(8);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground font-medium text-sm touch-manipulation hover:bg-secondary/80 transition-colors flex-shrink-0"
              title={language === "nl" ? "Zoeklink kopiëren" : "Copier le lien de recherche"}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "nl" ? "Delen" : "Partager"}</span>
            </button>
          )}

          {/* TCO Matchmaker button */}
          {onOpenBuyerProfile && (
            <button
              onClick={onOpenBuyerProfile}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm touch-manipulation transition-colors flex-shrink-0 ${
                buyerProfile?.isConfigured
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
              title="Activer le matching personnalisé"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">
                {buyerProfile?.isConfigured ? "Mon profil" : "Matching"}
              </span>
            </button>
          )}

          {/* Sort dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="search-input w-36 sm:w-48 appearance-none cursor-pointer pr-8 text-xs sm:text-sm py-2"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {cars.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
            {cars.map((car, index) => (
              <div
                key={car.id}
                style={index > 5 ? { contentVisibility: "auto", containIntrinsicSize: "auto 380px" } : undefined}
              >
                <CarCard
                  car={car}
                  isFavorite={isFavorite(car.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onCarClick}
                  buyerProfile={buyerProfile}
                  favoriteCount={favCounts[car.id]}
                />
              </div>
            ))}

            {/* Skeleton loaders while loading more */}
            {isLoadingMore && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <CarCardSkeleton />
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Infinite Scroll Trigger - Auto load on scroll */}
          <div ref={loadMoreRef} className="mt-8 flex justify-center min-h-[40px]">
            {!hasMore && cars.length > 0 && (
              <p className="text-muted-foreground text-sm">
                {language === "nl" 
                  ? `Alle ${cars.length} voertuigen weergegeven`
                  : `Tous les ${cars.length} véhicules affichés`
                }
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-16 sm:py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
            {texts.noVehicles}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-4 mb-6">
            {texts.noVehiclesDesc}
          </p>
          {activeFiltersCount > 0 && onResetFilters && (
            <Button onClick={onResetFilters} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {language === "nl" ? "Filters resetten" : "Réinitialiser les filtres"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadMoreGrid;
