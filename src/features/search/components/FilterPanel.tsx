/**
 * FilterPanel component - sidebar with all vehicle search filters
 * @module features/search/components
 */

import { useState, useEffect, memo } from "react";
import { Fuel, Calendar, Gauge, Settings2, Leaf, X, ChevronDown, Euro, Car, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { EURO_NORMS, BELGIAN_PROVINCES } from "../types/search.types";
import type { VehicleFilters } from "@/features/listings/types/vehicle.types";

/**
 * Props for the FilterPanel component
 */
export interface FilterPanelProps {
  /** Whether the panel is open (mobile) */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Current filter values */
  filters: VehicleFilters;
  /** Callback when a filter changes */
  onFilterChange: <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => void;
  /** Callback to reset all filters */
  onReset: () => void;
  /** Number of results matching current filters */
  resultsCount: number;
}

/**
 * FilterPanel provides a comprehensive set of filters for vehicle search
 * including brand, model, price, year, mileage, fuel type, and more
 */
const FilterPanel = memo(function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  resultsCount,
}: FilterPanelProps) {
  const brands = getAllBrands();
  const { t } = useLanguage();
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Fetch models when brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!filters.brand) {
        setModels([]);
        return;
      }
      
      setLoadingModels(true);
      const fetchedModels = await getModelsByBrand(filters.brand);
      setModels(fetchedModels);
      setLoadingModels(false);
    };

    fetchModels();
  }, [filters.brand]);

  // Reset model when brand changes
  const handleBrandChange = (brand: string) => {
    onFilterChange("brand", brand);
    onFilterChange("model", "");
  };

  const fuelTypes = [
    { id: "essence", label: t("filters.gasoline") },
    { id: "diesel", label: t("filters.diesel") },
    { id: "hybride", label: t("filters.hybrid") },
    { id: "electrique", label: t("filters.electric") },
  ];

  const transmissions = [
    { id: "manuelle", label: t("filters.manual") },
    { id: "automatique", label: t("filters.automatic") },
  ];

  const toggleFuel = (fuelId: string) => {
    const newFuels = filters.fuelTypes.includes(fuelId)
      ? filters.fuelTypes.filter((f) => f !== fuelId)
      : [...filters.fuelTypes, fuelId];
    onFilterChange("fuelTypes", newFuels);
  };

  const formatPriceLabel = (value: number) => {
    if (value >= 1000000) return "1M+ €";
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k €`;
    return `${value} €`;
  };

  const formatKmLabel = (value: number) => {
    if (value >= 500000) return "500k+ km";
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k km`;
    return `${value} km`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-20 left-0 z-50 lg:z-auto
          w-80 h-[calc(100vh-5rem)] overflow-y-auto
          glass-panel p-6 space-y-6 rounded-2xl
          transform transition-transform duration-300 lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Filtres de recherche"
      >
        {/* Mobile header */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold">{t("filters.title")}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-2xl"
            aria-label="Fermer les filtres"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results count */}
        <div className="text-center py-3 px-4 rounded-2xl bg-primary/10 border border-primary/20">
          <span className="text-primary font-bold text-lg">{resultsCount}</span>
          <span className="text-muted-foreground ml-2">{t("filters.vehicles")}</span>
        </div>

        {/* Province Select */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            Province
          </h3>
          <div className="relative">
            <select
              value={filters.searchQuery || ""}
              onChange={(e) => onFilterChange("searchQuery", e.target.value)}
              className="search-input w-full appearance-none cursor-pointer pr-10 rounded-2xl bg-card"
              aria-label="Sélectionner une province"
            >
              {BELGIAN_PROVINCES.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Brand Select */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Settings2 className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.brand")}
          </h3>
          <div className="relative">
            <select
              value={filters.brand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="search-input w-full appearance-none cursor-pointer pr-10 rounded-2xl bg-card"
              aria-label="Sélectionner une marque"
            >
              <option value="">{t("filters.allBrands")}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Model Select */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Car className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.model")}
          </h3>
          <div className="relative">
            <select
              value={filters.model}
              onChange={(e) => onFilterChange("model", e.target.value)}
              className="search-input w-full appearance-none cursor-pointer pr-10 disabled:opacity-50 rounded-2xl bg-card"
              disabled={!filters.brand || loadingModels}
              aria-label="Sélectionner un modèle"
            >
              <option value="">{t("filters.allModels")}</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
          {!filters.brand && (
            <p className="text-xs text-muted-foreground">{t("filters.selectBrandFirst")}</p>
          )}
        </div>

        {/* Fuel Type */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Fuel className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.fuel")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {fuelTypes.map((fuel) => (
              <button
                key={fuel.id}
                onClick={() => toggleFuel(fuel.id)}
                aria-pressed={filters.fuelTypes.includes(fuel.id)}
                className={`filter-chip text-center rounded-2xl ${
                  filters.fuelTypes.includes(fuel.id) ? "active" : ""
                }`}
              >
                {fuel.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Euro className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.budget")}
          </h3>
          <div className="px-2">
            <Slider
              min={0}
              max={200000}
              step={5000}
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={([min, max]) => {
                onFilterChange("minPrice", min);
                onFilterChange("maxPrice", max);
              }}
              className="my-4"
              aria-label="Plage de prix"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatPriceLabel(filters.minPrice)}</span>
              <span>{formatPriceLabel(filters.maxPrice)}</span>
            </div>
          </div>
        </div>

        {/* Year Range */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.year")}
          </h3>
          <div className="px-2">
            <Slider
              min={2010}
              max={2026}
              step={1}
              value={[filters.yearMin, filters.yearMax]}
              onValueChange={([min, max]) => {
                onFilterChange("yearMin", min);
                onFilterChange("yearMax", max);
              }}
              className="my-4"
              aria-label="Plage d'années"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{filters.yearMin}</span>
              <span>{filters.yearMax}</span>
            </div>
          </div>
        </div>

        {/* Kilometer Range */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Gauge className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.mileage")}
          </h3>
          <div className="px-2">
            <Slider
              min={0}
              max={200000}
              step={5000}
              value={[filters.kmMin, filters.kmMax]}
              onValueChange={([min, max]) => {
                onFilterChange("kmMin", min);
                onFilterChange("kmMax", max);
              }}
              className="my-4"
              aria-label="Plage de kilométrage"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatKmLabel(filters.kmMin)}</span>
              <span>{formatKmLabel(filters.kmMax)}</span>
            </div>
          </div>
        </div>

        {/* Transmission */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Settings2 className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.transmission")}
          </h3>
          <div className="flex gap-2">
            {transmissions.map((trans) => (
              <button
                key={trans.id}
                onClick={() =>
                  onFilterChange(
                    "transmission",
                    filters.transmission === trans.id ? "" : trans.id
                  )
                }
                aria-pressed={filters.transmission === trans.id}
                className={`filter-chip flex-1 text-center rounded-2xl ${
                  filters.transmission === trans.id ? "active" : ""
                }`}
              >
                {trans.label}
              </button>
            ))}
          </div>
        </div>

        {/* Euro Norm */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Leaf className="w-4 h-4 text-primary" aria-hidden="true" />
            {t("filters.euroNorm")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {EURO_NORMS.map((norm) => (
              <button
                key={norm}
                onClick={() =>
                  onFilterChange("euroNorm", filters.euroNorm === norm ? "" : norm)
                }
                aria-pressed={filters.euroNorm === norm}
                className={`filter-chip text-center rounded-2xl ${
                  filters.euroNorm === norm ? "active" : ""
                }`}
              >
                {norm}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={filters.lezOnly}
              onChange={(e) => onFilterChange("lezOnly", e.target.checked)}
              className="w-4 h-4 rounded-lg border-border bg-secondary text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">
              {t("filters.lezOnly")}
            </span>
          </label>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full py-3 text-center text-sm text-muted-foreground hover:text-foreground border border-border rounded-2xl hover:bg-secondary transition-colors shadow-sm hover:shadow-lg"
        >
          {t("filters.reset")}
        </button>
      </aside>
    </>
  );
});

export default FilterPanel;
