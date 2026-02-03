import { CarCard, type Car } from "@/features/listings";
import { SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CarGridProps {
  cars: Car[];
  onOpenFilters: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  isFavorite: (carId: string) => boolean;
  onToggleFavorite: (carId: string) => void;
  onCarClick: (carId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startItem: number;
  endItem: number;
  totalItems: number;
  activeFiltersCount: number;
}

const CarGrid = ({
  cars,
  onOpenFilters,
  sortBy,
  onSortChange,
  isFavorite,
  onToggleFavorite,
  onCarClick,
  currentPage,
  totalPages,
  onPageChange,
  startItem,
  endItem,
  totalItems,
  activeFiltersCount,
}: CarGridProps) => {
  const { t, language } = useLanguage();

  const sortOptions = [
    { value: "recent", label: language === "nl" ? "Meest recent" : language === "en" ? "Most recent" : "Plus récentes" },
    { value: "price-asc", label: language === "nl" ? "Prijs oplopend" : language === "en" ? "Price ascending" : "Prix croissant" },
    { value: "price-desc", label: language === "nl" ? "Prijs aflopend" : language === "en" ? "Price descending" : "Prix décroissant" },
    { value: "year-desc", label: language === "nl" ? "Jaar aflopend" : language === "en" ? "Year descending" : "Année décroissante" },
    { value: "km-asc", label: language === "nl" ? "Km oplopend" : language === "en" ? "Mileage ascending" : "Kilométrage croissant" },
  ];

  const renderPagination = () => {
    const pages = [];
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

  const availableLabel = language === "nl" ? "Beschikbare voertuigen" : language === "en" ? "Available vehicles" : "Véhicules disponibles";
  const onLabel = language === "nl" ? "op" : language === "en" ? "of" : "sur";
  const vehiclesLabel = language === "nl" ? "voertuigen" : language === "en" ? "vehicles" : "véhicules";
  const filtersLabel = t("filters.title");
  const noVehiclesTitle = language === "nl" ? "Geen voertuigen gevonden" : language === "en" ? "No vehicles found" : "Aucun véhicule trouvé";
  const noVehiclesDesc = language === "nl" ? "Wijzig uw zoekcriteria om overeenkomende voertuigen te vinden." : language === "en" ? "Modify your search criteria to find matching vehicles." : "Modifiez vos critères de recherche pour trouver des véhicules correspondants.";
  const prevLabel = language === "nl" ? "Vorige" : language === "en" ? "Previous" : "Précédent";
  const nextLabel = language === "nl" ? "Volgende" : language === "en" ? "Next" : "Suivant";

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {availableLabel}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {startItem}-{endItem} {onLabel} {totalItems} {vehiclesLabel}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile filter button */}
          <button
            onClick={onOpenFilters}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium relative touch-manipulation"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {filtersLabel}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {cars.map((car, index) => (
            <div
              key={car.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
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
      ) : (
        <div className="text-center py-16 sm:py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
            {noVehiclesTitle}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-4">
            {noVehiclesDesc}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
            {prevLabel}
          </button>

          <div className="flex items-center gap-2">{renderPagination()}</div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CarGrid;
