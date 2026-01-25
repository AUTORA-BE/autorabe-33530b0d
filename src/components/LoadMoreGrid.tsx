import { useEffect, useRef, useCallback } from "react";
import CarCard, { Car } from "./CarCard";
import { SlidersHorizontal, ChevronDown, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";

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
}

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
}: LoadMoreGridProps) => {
  const { language } = useLanguage();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
      threshold: 0.1,
      rootMargin: "100px",
    });
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

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

  if (isLoading) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="h-8 w-48 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-secondary/50 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[400px] bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {texts.available}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {cars.length} {texts.showing} {totalCount} {texts.vehicles}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile filter button */}
          <button
            onClick={onOpenFilters}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium relative touch-manipulation"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {texts.filters}
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="search-input w-full sm:w-48 appearance-none cursor-pointer pr-10 text-sm sm:text-base"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {cars.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {cars.map((car, index) => (
              <div
                key={car.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
              >
                <CarCard
                  car={car}
                  isFavorite={isFavorite(car.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onCarClick}
                />
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger - Auto load on scroll */}
          <div ref={loadMoreRef} className="mt-8 flex justify-center min-h-[60px]">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{texts.loading}</span>
              </div>
            )}
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
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-4">
            {texts.noVehiclesDesc}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadMoreGrid;
