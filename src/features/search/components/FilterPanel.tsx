/**
 * FilterPanel component - sidebar with all vehicle search filters
 * @module features/search/components
 */

import React, { useState, useEffect, useRef, useCallback, memo, forwardRef } from "react";
import { Fuel, Calendar, Gauge, Settings2, Leaf, X, ChevronDown, Euro, Car, MapPin, Building2, User, CarFront, Truck, CircleDot, RectangleHorizontal, Waypoints, Sparkles, Sun, Users, Palette } from "lucide-react";
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

/** Reusable filter section with icon and title */
function FilterSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
/**
 * FilterPanel provides a comprehensive set of filters for vehicle search
 * including brand, model, price, year, mileage, fuel type, and more
 */
const FilterPanel = memo(forwardRef<HTMLElement, FilterPanelProps>(function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  resultsCount,
}, ref) {
  const brands = getAllBrands();
  const { t } = useLanguage();
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Swipe-down to close
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef(0);
  const drawerInternalRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = drawerInternalRef.current?.querySelector("[data-scroll-content]") as HTMLElement | null;
    if (scrollEl && scrollEl.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta < 0) { touchDeltaY.current = 0; return; }
    touchDeltaY.current = delta;
    if (drawerInternalRef.current) {
      drawerInternalRef.current.style.transform = `translateY(${delta}px)`;
      drawerInternalRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null) return;
    touchStartY.current = null;
    if (drawerInternalRef.current) {
      drawerInternalRef.current.style.transition = "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";
      if (touchDeltaY.current > 100) {
        if (navigator.vibrate) navigator.vibrate(8);
        drawerInternalRef.current.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";
        drawerInternalRef.current.style.transform = "translateY(100%)";
        setTimeout(onClose, 350);
      } else {
        drawerInternalRef.current.style.transform = "translateY(0)";
      }
    }
    touchDeltaY.current = 0;
  }, [onClose]);

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
    if (value >= 100000) return `${(value / 1000).toFixed(0)}k €`;
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
          className="lg:hidden fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={(el) => {
          drawerInternalRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed lg:sticky lg:top-20
          z-50 lg:z-auto
          inset-x-0 bottom-0 lg:inset-auto lg:left-auto
          w-full lg:w-80
          max-h-[85dvh] lg:max-h-none lg:h-[calc(100vh-5rem)]
          overflow-hidden lg:overflow-y-auto scrollbar-thin
          lg:rounded-2xl
          border-t lg:border border-border
          bg-card
          transform transition-transform duration-300 ease-out lg:transform-none
          rounded-t-3xl lg:rounded-t-2xl
          ${isOpen ? "translate-y-0 visible" : "translate-y-full lg:translate-y-0 invisible lg:visible pointer-events-none lg:pointer-events-auto"}
        `}
        style={{
          background: "hsl(var(--card))",
          boxShadow: isOpen ? "0 -8px 40px -4px hsl(var(--foreground) / 0.15)" : "0 8px 32px -4px hsl(var(--foreground) / 0.08)",
        }}
        aria-label="Filtres de recherche"
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-card z-10">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Mobile header — sticky */}
        <div className="lg:hidden flex justify-between items-center px-5 pb-3 pt-1 sticky top-5 bg-card z-10 border-b border-border/50">
          <h2 className="font-display text-lg font-bold text-foreground">{t("filters.title")}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/80 rounded-xl transition-colors"
            aria-label="Fermer les filtres"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div data-scroll-content className="overflow-y-auto px-5 pt-4 pb-28 lg:pb-5 lg:pt-0 space-y-5 lg:p-5 lg:space-y-5" style={{ maxHeight: "calc(85dvh - 140px)" }}>

        {/* Results count */}
        <div
          className="text-center py-2.5 px-4 rounded-2xl border"
          style={{
            background: "hsl(var(--primary) / 0.08)",
            borderColor: "hsl(var(--primary) / 0.15)",
          }}
        >
          <span className="text-primary font-bold text-lg">{resultsCount}</span>
          <span className="text-muted-foreground ml-2">{t("filters.vehicles")}</span>
        </div>

        {/* Divider */}
        <div className="h-px w-full" style={{ background: "hsl(var(--border) / 0.5)" }} />

        {/* Province Select */}
        <FilterSection icon={<MapPin className="w-4 h-4 text-primary" aria-hidden="true" />} title="Province">
          <div className="relative">
            <select
              value={filters.searchQuery || ""}
              onChange={(e) => onFilterChange("searchQuery", e.target.value)}
              className="w-full appearance-none cursor-pointer pr-10 px-4 py-3 rounded-xl text-sm bg-secondary/60 border border-border/50 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Sélectionner une province"
            >
              {BELGIAN_PROVINCES.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </FilterSection>

        {/* Brand Select */}
        <FilterSection icon={<Settings2 className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.brand")}>
          <div className="relative">
            <select
              value={filters.brand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full appearance-none cursor-pointer pr-10 px-4 py-3 rounded-xl text-sm bg-secondary/60 border border-border/50 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Sélectionner une marque"
            >
              <option value="">{t("filters.allBrands")}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </FilterSection>

        {/* Model Select */}
        <FilterSection icon={<Car className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.model")}>
          <div className="relative">
            <select
              value={filters.model}
              onChange={(e) => onFilterChange("model", e.target.value)}
              className="w-full appearance-none cursor-pointer pr-10 px-4 py-3 rounded-xl text-sm bg-secondary/60 border border-border/50 text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          {!filters.brand && (
            <p className="text-xs text-muted-foreground/70">{t("filters.selectBrandFirst")}</p>
          )}
        </FilterSection>

        {/* Divider */}
        <div className="h-px w-full" style={{ background: "hsl(var(--border) / 0.5)" }} />

        {/* Body Type */}
        <FilterSection icon={<Car className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.bodyType")}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "Berline", label: t("filters.bodySedan"), Icon: CarFront },
              { id: "SUV", label: t("filters.bodySUV"), Icon: Truck },
              { id: "Citadine", label: t("filters.bodyCity"), Icon: CircleDot },
              { id: "Compacte", label: t("filters.bodyCompact"), Icon: Car },
              { id: "Break", label: t("filters.bodyWagon"), Icon: RectangleHorizontal },
              { id: "Coupé", label: t("filters.bodyCoupe"), Icon: Sparkles },
              { id: "Cabriolet", label: t("filters.bodyConvertible"), Icon: Sun },
              { id: "Monospace", label: t("filters.bodyMPV"), Icon: Users },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() =>
                  onFilterChange("bodyType", filters.bodyType === id ? "" : id)
                }
                aria-pressed={filters.bodyType === id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filters.bodyType === id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={filters.bodyType === id ? { boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)" } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Fuel Type */}
        <FilterSection icon={<Fuel className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.fuel")}>
          <div className="grid grid-cols-2 gap-2">
            {fuelTypes.map((fuel) => (
              <button
                key={fuel.id}
                onClick={() => toggleFuel(fuel.id)}
                aria-pressed={filters.fuelTypes.includes(fuel.id)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium text-center transition-all duration-200 ${
                  filters.fuelTypes.includes(fuel.id)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={filters.fuelTypes.includes(fuel.id) ? { boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)" } : undefined}
              >
                {fuel.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection icon={<Euro className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.budget")}>
          <div className="px-1">
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
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span className="px-2 py-1 rounded-lg bg-secondary/60">{formatPriceLabel(filters.minPrice)}</span>
              <span className="px-2 py-1 rounded-lg bg-secondary/60">{formatPriceLabel(filters.maxPrice)}</span>
            </div>
          </div>
        </FilterSection>

        {/* Year Range */}
        <FilterSection icon={<Calendar className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.year")}>
          <div className="px-1">
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
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span className="px-2 py-1 rounded-lg bg-secondary/60">{filters.yearMin}</span>
              <span className="px-2 py-1 rounded-lg bg-secondary/60">{filters.yearMax}</span>
            </div>
          </div>
        </FilterSection>

        {/* Kilometer Range */}
        <FilterSection icon={<Gauge className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.mileage")}>
          <div className="px-1">
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
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span className="px-2 py-1 rounded-lg bg-secondary/60">{formatKmLabel(filters.kmMin)}</span>
              <span className="px-2 py-1 rounded-lg bg-secondary/60">{formatKmLabel(filters.kmMax)}</span>
            </div>
          </div>
        </FilterSection>

        {/* Color Filter */}
        <FilterSection icon={<Palette className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.color") || "Couleur"}>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "Noir", hex: "#1a1a1a", key: "filters.colorBlack" },
              { id: "Blanc", hex: "#f5f5f5", key: "filters.colorWhite" },
              { id: "Gris", hex: "#9ca3af", key: "filters.colorGrey" },
              { id: "Argent", hex: "#c0c0c0", key: "filters.colorSilver" },
              { id: "Bleu", hex: "#3b82f6", key: "filters.colorBlue" },
              { id: "Rouge", hex: "#ef4444", key: "filters.colorRed" },
              { id: "Vert", hex: "#22c55e", key: "filters.colorGreen" },
              { id: "Jaune", hex: "#eab308", key: "filters.colorYellow" },
              { id: "Orange", hex: "#f97316", key: "filters.colorOrange" },
              { id: "Marron", hex: "#92400e", key: "filters.colorBrown" },
              { id: "Beige", hex: "#d4b896", key: "filters.colorBeige" },
            ].map(({ id, hex, key }) => (
              <button
                key={id}
                onClick={() => onFilterChange("color", filters.color === id ? "" : id)}
                aria-pressed={filters.color === id}
                aria-label={t(key) || id}
                title={t(key) || id}
                className={`w-9 h-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  filters.color === id
                    ? "border-primary scale-110 shadow-md ring-2 ring-primary/30"
                    : "border-border/50 hover:border-foreground/30 hover:scale-105"
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full"
                  style={{
                    backgroundColor: hex,
                    boxShadow: id === "Blanc" ? "inset 0 0 0 1px hsl(var(--border))" : undefined,
                  }}
                />
              </button>
            ))}
          </div>
          {filters.color && (
            <p className="text-xs text-muted-foreground mt-1">
              {t(`filters.color${filters.color === "Noir" ? "Black" : filters.color === "Blanc" ? "White" : filters.color === "Gris" ? "Grey" : filters.color === "Argent" ? "Silver" : filters.color === "Bleu" ? "Blue" : filters.color === "Rouge" ? "Red" : filters.color === "Vert" ? "Green" : filters.color === "Jaune" ? "Yellow" : filters.color === "Orange" ? "Orange" : filters.color === "Marron" ? "Brown" : "Beige"}`) || filters.color}
            </p>
          )}
        </FilterSection>

        {/* Divider */}
        <div className="h-px w-full" style={{ background: "hsl(var(--border) / 0.5)" }} />

        {/* Seller Type */}
        <FilterSection icon={<Building2 className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.sellerType")}>
          <div className="flex gap-2">
            {[
              { id: "particulier", label: t("filters.sellerPrivate"), Icon: User },
              { id: "professionnel", label: t("filters.sellerPro"), Icon: Building2 },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() =>
                  onFilterChange(
                    "sellerTypeFilter",
                    filters.sellerTypeFilter === id ? "" : id
                  )
                }
                aria-pressed={filters.sellerTypeFilter === id}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filters.sellerTypeFilter === id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={filters.sellerTypeFilter === id ? { boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)" } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Transmission */}
        <FilterSection icon={<Settings2 className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.transmission")}>
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
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium text-center transition-all duration-200 ${
                  filters.transmission === trans.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={filters.transmission === trans.id ? { boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)" } : undefined}
              >
                {trans.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Euro Norm */}
        <FilterSection icon={<Leaf className="w-4 h-4 text-primary" aria-hidden="true" />} title={t("filters.euroNorm")}>
          <div className="grid grid-cols-2 gap-2">
            {EURO_NORMS.map((norm) => (
              <button
                key={norm}
                onClick={() =>
                  onFilterChange("euroNorm", filters.euroNorm === norm ? "" : norm)
                }
                aria-pressed={filters.euroNorm === norm}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium text-center transition-all duration-200 ${
                  filters.euroNorm === norm
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={filters.euroNorm === norm ? { boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)" } : undefined}
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
              className="w-4 h-4 rounded-md border-border bg-secondary text-primary focus:ring-primary accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              {t("filters.lezOnly")}
            </span>
          </label>
        </FilterSection>

        {/* Reset Button — desktop only */}
        <button
          onClick={onReset}
          className="hidden lg:block w-full py-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl border border-border/50 hover:bg-secondary/80 transition-all duration-200"
          style={{ boxShadow: "0 1px 3px hsl(var(--foreground) / 0.04)" }}
        >
          {t("filters.reset")}
        </button>

        </div>{/* end scrollable content */}

        {/* Mobile sticky footer CTA */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-4 bg-card border-t border-border/50 safe-bottom z-10"
          style={{ boxShadow: "0 -4px 20px -4px hsl(var(--foreground) / 0.1)" }}
        >
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex-1 py-3 text-center text-sm font-medium text-muted-foreground rounded-xl border border-border/50 hover:bg-secondary/80 transition-all"
            >
              {t("filters.reset")}
            </button>
            <button
              onClick={onClose}
              className="flex-[2] py-3 text-center text-sm font-semibold text-primary-foreground rounded-xl btn-primary-gradient"
            >
              {resultsCount} {t("filters.vehicles")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}));

export default FilterPanel;
