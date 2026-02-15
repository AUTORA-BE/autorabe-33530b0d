/**
 * VehicleGrid component for displaying paginated vehicle listings
 * @module features/listings/components
 */

import { memo } from "react";
import { SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import VehicleCard from "./VehicleCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Vehicle, VehicleSortOption } from "../types/vehicle.types";

/**
 * Props for the VehicleGrid component
 */
export interface VehicleGridProps {
  /** Array of vehicles to display */
  vehicles: Vehicle[];
  /** Callback to open filter panel */
  onOpenFilters: () => void;
  /** Current sort option */
  sortBy: VehicleSortOption;
  /** Callback when sort changes */
  onSortChange: (sort: VehicleSortOption) => void;
  /** Function to check if a vehicle is favorited */
  isFavorite: (vehicleId: string) => boolean;
  /** Callback when favorite is toggled */
  onToggleFavorite: (vehicleId: string) => void;
  /** Callback when a vehicle card is clicked */
  onVehicleClick: (vehicleId: string) => void;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** First item index on current page */
  startItem: number;
  /** Last item index on current page */
  endItem: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of active filters */
  activeFiltersCount: number;
}

/**
 * Sort option configuration with localized labels
 */
interface SortOption {
  value: VehicleSortOption;
  labels: Record<string, string>;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "recent", labels: { nl: "Meest recent", en: "Most recent", fr: "Plus récentes" } },
  { value: "price-asc", labels: { nl: "Prijs oplopend", en: "Price ascending", fr: "Prix croissant" } },
  { value: "price-desc", labels: { nl: "Prijs aflopend", en: "Price descending", fr: "Prix décroissant" } },
  { value: "year-desc", labels: { nl: "Jaar aflopend", en: "Year descending", fr: "Année décroissante" } },
  { value: "km-asc", labels: { nl: "Km oplopend", en: "Mileage ascending", fr: "Kilométrage croissant" } },
];

/**
 * VehicleGrid displays a responsive grid of vehicle cards with
 * sorting, filtering controls, and pagination
 */
const VehicleGrid = memo(function VehicleGrid({
  vehicles,
  onOpenFilters,
  sortBy,
  onSortChange,
  isFavorite,
  onToggleFavorite,
  onVehicleClick,
  currentPage,
  totalPages,
  onPageChange,
  startItem,
  endItem,
  totalItems,
  activeFiltersCount,
}: VehicleGridProps) {
  const { t, language } = useLanguage();

  // Localized labels
  const labels = {
    available: language === "nl" ? "Beschikbare voertuigen" : language === "en" ? "Available vehicles" : "Véhicules disponibles",
    of: language === "nl" ? "op" : language === "en" ? "of" : "sur",
    vehicles: language === "nl" ? "voertuigen" : language === "en" ? "vehicles" : "véhicules",
    filters: t("filters.title"),
    noResults: language === "nl" ? "Geen voertuigen gevonden" : language === "en" ? "No vehicles found" : "Aucun véhicule trouvé",
    noResultsDesc: language === "nl" 
      ? "Wijzig uw zoekcriteria om overeenkomende voertuigen te vinden." 
      : language === "en" 
        ? "Modify your search criteria to find matching vehicles." 
        : "Modifiez vos critères de recherche pour trouver des véhicules correspondants.",
    prev: language === "nl" ? "Vorige" : language === "en" ? "Previous" : "Précédent",
    next: language === "nl" ? "Volgende" : language === "en" ? "Next" : "Suivant",
  };

  /**
   * Renders pagination buttons with ellipsis for large page counts
   */
  const renderPagination = () => {
    const pages: JSX.Element[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          aria-label={`Page ${i}`}
          aria-current={i === currentPage ? "page" : undefined}
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-colors ${
            i === currentPage
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as VehicleSortOption);
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {labels.available}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {startItem}-{endItem} {labels.of} {totalItems} {labels.vehicles}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile filter button */}
          <button
            onClick={onOpenFilters}
            aria-label="Ouvrir les filtres"
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium relative touch-manipulation"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {labels.filters}
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
              onChange={handleSortChange}
              aria-label="Trier par"
              className="search-input w-full sm:w-48 appearance-none cursor-pointer pr-10 text-sm sm:text-base"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.labels[language] || option.labels.fr}
                </option>
              ))}
            </select>
            <ChevronDown 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" 
              aria-hidden="true" 
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {vehicles.map((vehicle, index) => (
            <div
              key={vehicle.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
            >
              <VehicleCard
                vehicle={vehicle}
                isFavorite={isFavorite(vehicle.id)}
                onToggleFavorite={onToggleFavorite}
                onClick={onVehicleClick}
                eager={index < 3}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
            {labels.noResults}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-4">
            {labels.noResultsDesc}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav 
          aria-label="Pagination" 
          className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Page précédente"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {labels.prev}
          </button>

          <div className="flex items-center gap-2">{renderPagination()}</div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {labels.next}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
});

export default VehicleGrid;
