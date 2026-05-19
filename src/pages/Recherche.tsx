/**
 * Recherche — luxury catalogue search page.
 * No left sidebar: full-width centered layout with a floating pill filter bar
 * (Prix max, Énergie, Kilométrage) and a side-drawer (Sheet) for "Plus de filtres".
 * @module pages
 */

import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import {
  ShieldCheck, Leaf, ChevronDown, SlidersHorizontal, Grid3x3, Flame, Calendar, Gauge, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useVehicleSearch } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { BUDGET_OPTIONS, EURO_NORMS } from "@/features/search/types/search.types";
import CarImage from "@/components/cars/CarImage";
import type { Vehicle } from "@/features/listings/types/vehicle.types";

const SwipeDiscovery = lazy(() => import("@/features/listings/components/SwipeDiscovery"));

type ViewMode = "catalog" | "match";

const FUEL_OPTIONS = [
  { id: "essence",    labelFr: "Essence" },
  { id: "diesel",     labelFr: "Diesel" },
  { id: "hybride",    labelFr: "Hybride" },
  { id: "electrique", labelFr: "Électrique" },
];

const KM_PRESETS = [30000, 60000, 100000, 150000, 500000];

const TRANSMISSION_OPTIONS = [
  { id: "",            label: "Toutes" },
  { id: "manuelle",    label: "Manuelle" },
  { id: "automatique", label: "Automatique" },
];

const COLOR_OPTIONS = [
  { id: "",       label: "Toutes" },
  { id: "blanc",  label: "Blanc" },
  { id: "noir",   label: "Noir" },
  { id: "gris",   label: "Gris" },
  { id: "bleu",   label: "Bleu" },
  { id: "rouge",  label: "Rouge" },
  { id: "vert",   label: "Vert" },
];

const CURRENT_YEAR = new Date().getFullYear();

/* ─────────────── Luxury Car Card ─────────────── */

function LuxuryCarCard({ car, onClick }: { car: Vehicle; onClick: (id: string) => void }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onClick(car.id)}
      className="group cursor-pointer rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
    >
      {/* Cinematic image — 16:9 with smooth zoom contained by overflow-hidden */}
      <div className="aspect-video relative overflow-hidden bg-muted">
        <CarImage
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />

        {/* Subtle vignette on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Premium top-row badges (glass + bright text) */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          {car.hasCarPass && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/30 text-primary text-[11px] font-semibold tracking-wide shadow-lg shadow-primary/10">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
              Car-Pass
            </span>
          )}
          {car.isLezCompatible && (
            <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-400/15 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold tracking-wide shadow-lg">
              <Leaf className="w-3.5 h-3.5" strokeWidth={2} />
              LEZ
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-7 flex flex-col gap-4">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-foreground leading-tight tracking-tight">
            {car.brand} <span className="text-foreground/80">{car.model}</span>
          </h3>
          <div className="mt-2 flex items-center gap-3 text-[12px] text-muted-foreground font-light">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              {car.year}
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3 h-3" strokeWidth={1.5} />
              {car.mileage.toLocaleString("fr-BE")} km
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-2 border-t border-border/30">
          <span className="font-serif text-4xl sm:text-5xl font-semibold text-foreground tracking-tight tabular-nums leading-none pt-3">
            {car.price.toLocaleString("fr-BE")}<span className="text-2xl sm:text-3xl text-muted-foreground font-light ml-1">€</span>
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────── Pill Filter Bar ─────────────── */

interface FilterBarProps {
  filters: ReturnType<typeof useVehicleSearch>["filters"];
  updateFilter: ReturnType<typeof useVehicleSearch>["updateFilter"];
  onOpenMore: () => void;
}

function PillFilterBar({ filters, updateFilter, onOpenMore }: FilterBarProps) {
  const budgetLabel = filters.maxPrice < 1000000
    ? `≤ ${filters.maxPrice.toLocaleString("fr-BE")} €`
    : "Prix max";

  const fuelLabel = filters.fuelTypes.length > 0
    ? (FUEL_OPTIONS.find((f) => f.id === filters.fuelTypes[0])?.labelFr ?? "Énergie") +
      (filters.fuelTypes.length > 1 ? ` +${filters.fuelTypes.length - 1}` : "")
    : "Énergie";

  const kmLabel = filters.kmMax < 500000
    ? `≤ ${filters.kmMax.toLocaleString("fr-BE")} km`
    : "Kilométrage";

  const triggerCls = "rounded-full bg-transparent hover:bg-secondary/60 text-sm font-medium px-5 h-11 gap-1.5 border-0";

  return (
    <div className="hidden md:flex items-center gap-1 p-2 rounded-full bg-background/60 backdrop-blur-xl border border-border/40 shadow-2xl shadow-primary/5 ring-1 ring-white/5">
      {/* Prix max */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={triggerCls}>
            {budgetLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-6 rounded-2xl" align="start">
          <div className="space-y-5">
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Prix maximum</label>
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {filters.maxPrice >= 1000000 ? "∞" : `${filters.maxPrice.toLocaleString("fr-BE")} €`}
              </span>
            </div>
            <Slider
              value={[filters.maxPrice >= 1000000 ? 150000 : filters.maxPrice]}
              onValueChange={(v) => updateFilter("maxPrice", v[0] >= 150000 ? 1000000 : v[0])}
              min={5000}
              max={150000}
              step={1000}
            />
            <div className="flex flex-wrap gap-1.5 pt-2">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => updateFilter("maxPrice", b.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    filters.maxPrice === b.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-px h-5 bg-border/60" />

      {/* Énergie */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={triggerCls}>
            {fuelLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 rounded-2xl" align="start">
          <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium block mb-3">Type d'énergie</label>
          <div className="grid grid-cols-2 gap-2">
            {FUEL_OPTIONS.map((f) => {
              const active = filters.fuelTypes.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    const next = active
                      ? filters.fuelTypes.filter((x) => x !== f.id)
                      : [...filters.fuelTypes, f.id];
                    updateFilter("fuelTypes", next);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:border-primary/40 text-foreground"
                  }`}
                >
                  {f.labelFr}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-px h-5 bg-border/60" />

      {/* Kilométrage */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={triggerCls}>
            {kmLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-6 rounded-2xl" align="start">
          <div className="space-y-5">
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Kilométrage maximum</label>
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {filters.kmMax >= 500000 ? "∞" : `${filters.kmMax.toLocaleString("fr-BE")} km`}
              </span>
            </div>
            <Slider
              value={[filters.kmMax >= 500000 ? 200000 : filters.kmMax]}
              onValueChange={(v) => updateFilter("kmMax", v[0] >= 200000 ? 500000 : v[0])}
              min={10000}
              max={200000}
              step={5000}
            />
            <div className="flex flex-wrap gap-1.5 pt-2">
              {KM_PRESETS.map((km) => (
                <button
                  key={km}
                  onClick={() => updateFilter("kmMax", km)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    filters.kmMax === km
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  {km >= 500000 ? "Tous" : `≤ ${(km / 1000).toLocaleString("fr-BE")}k km`}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-px h-5 bg-border/60" />

      {/* Plus de filtres → side drawer */}
      <Button variant="ghost" onClick={onOpenMore} className={triggerCls}>
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Plus de filtres
      </Button>
    </div>
  );
}

/* ─────────────── More Filters Sheet (side drawer) ─────────────── */

interface MoreFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ReturnType<typeof useVehicleSearch>["filters"];
  updateFilter: ReturnType<typeof useVehicleSearch>["updateFilter"];
  resetFilters: () => void;
  resultsCount: number;
  brands: string[];
  models: string[];
}

function MoreFiltersSheet({
  open, onOpenChange, filters, updateFilter, resetFilters, resultsCount, brands, models,
}: MoreFiltersSheetProps) {
  const fieldCls = "w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";
  const eyebrow = "text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium block mb-2";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l border-border/60"
      >
        <SheetHeader className="px-6 py-5 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="font-serif text-xl font-medium tracking-tight">Plus de filtres</SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-secondary/60 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
          {/* Marque & Modèle */}
          <div className="space-y-4">
            <div>
              <label className={eyebrow}>Marque</label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter("brand", e.target.value)}
                className={fieldCls}
              >
                <option value="">Toutes les marques</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={eyebrow}>Modèle</label>
              <select
                value={filters.searchQuery}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
                disabled={!filters.brand}
                className={`${fieldCls} disabled:opacity-50`}
              >
                <option value="">{filters.brand ? "Tous les modèles" : "Choisissez une marque"}</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Année */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className={`${eyebrow} mb-0`}>Année</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {filters.yearMin} – {filters.yearMax}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.yearMin}
                onChange={(e) => updateFilter("yearMin", Number(e.target.value))}
                className={fieldCls}
              >
                {Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                  <option key={y} value={y}>De {y}</option>
                ))}
              </select>
              <select
                value={filters.yearMax}
                onChange={(e) => updateFilter("yearMax", Number(e.target.value))}
                className={fieldCls}
              >
                {Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR + 1 - i).map((y) => (
                  <option key={y} value={y}>À {y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className={eyebrow}>Transmission</label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSMISSION_OPTIONS.map((t) => {
                const active = filters.transmission === t.id;
                return (
                  <button
                    key={t.id || "all"}
                    onClick={() => updateFilter("transmission", t.id)}
                    className={`h-11 rounded-xl text-sm font-medium border transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Norme Euro */}
          <div>
            <label className={eyebrow}>Norme Euro (LEZ)</label>
            <select
              value={filters.euroNorm}
              onChange={(e) => updateFilter("euroNorm", e.target.value)}
              className={fieldCls}
            >
              <option value="">Toutes</option>
              {EURO_NORMS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Couleur */}
          <div>
            <label className={eyebrow}>Couleur</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => {
                const active = filters.color === c.id;
                return (
                  <button
                    key={c.id || "all"}
                    onClick={() => updateFilter("color", c.id)}
                    className={`px-4 h-9 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LEZ-only */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Label htmlFor="lez-only" className="text-sm font-medium cursor-pointer">
              Uniquement compatibles LEZ
            </Label>
            <Checkbox
              id="lez-only"
              checked={filters.lezOnly}
              onCheckedChange={(v) => updateFilter("lezOnly", v === true)}
            />
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border/40 flex-row gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-1 rounded-full h-11"
          >
            Réinitialiser
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full h-11"
          >
            Voir {resultsCount.toLocaleString("fr-BE")} véhicules
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────── Main Page ─────────────── */

const Recherche = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("catalog");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const brands = useMemo(() => getAllBrands(), []);

  const {
    cars, isLoading, hasMore, loadMore, isLoadingMore, totalCount,
    filters, updateFilter, resetFilters,
  } = useVehicleSearch();

  const { isFavorite, toggleFavorite } = useFavorites();
  const vehicleHref = useLocalizedVehicleHref();

  useEffect(() => {
    if (filters.brand) getModelsByBrand(filters.brand).then(setModels);
    else setModels([]);
  }, [filters.brand]);

  const handleCarClick = (id: string) => {
    const car = cars.find((c) => c.id === id);
    navigate(vehicleHref(car ?? { id }));
  };

  const title =
    language === "nl" ? "Vind uw volgende auto"
    : language === "en" ? "Find your next car"
    : language === "de" ? "Finden Sie Ihr nächstes Auto"
    : "Trouvez votre prochaine voiture";

  const subtitle = (count: number) =>
    language === "nl"
      ? `Ontdek ${count.toLocaleString("fr-BE")} geverifieerde voertuigen, Car-Pass gegarandeerd en klaar om in België te rijden.`
      : language === "en"
      ? `Discover ${count.toLocaleString("fr-BE")} verified vehicles, Car-Pass guaranteed and ready to drive in Belgium.`
      : language === "de"
      ? `Entdecken Sie ${count.toLocaleString("fr-BE")} geprüfte Fahrzeuge, Car-Pass garantiert und bereit für die Straße in Belgien.`
      : `Découvrez ${count.toLocaleString("fr-BE")} véhicules vérifiés, garantis Car-Pass et prêts à rouler en Belgique.`;

  return (
    <div className="page-gradient min-h-screen">
      <SEOHead
        title="Rechercher une voiture | AutoRA"
        description="Catalogue premium de véhicules d'occasion en Belgique. Car-Pass certifié, LEZ vérifiée, prix transparent."
        url="https://autora.be/recherche"
      />
      <Header />

      <main className="pt-28 pb-32">
        {/* ── Hero header ── */}
        <section className="container mx-auto px-6 sm:px-8 text-center mb-10 sm:mb-14">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-tight leading-[1.1]"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-sm sm:text-base text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed"
          >
            {subtitle(totalCount || 482)}
          </motion.p>
        </section>

        {/* ── Floating pill filter bar (desktop) ── */}
        <section className="container mx-auto px-6 sm:px-8 mb-10 sm:mb-12 flex justify-center">
          <PillFilterBar
            filters={filters}
            updateFilter={updateFilter}
            onOpenMore={() => setMoreFiltersOpen(true)}
          />

          {/* Mobile single button */}
          <Button
            onClick={() => setMoreFiltersOpen(true)}
            className="md:hidden w-full rounded-full h-12 shadow-md"
            size="lg"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtrer la recherche
          </Button>
        </section>

        {/* ── View toggle + count ── */}
        <section className="container mx-auto px-6 sm:px-8 mb-8 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground font-light tabular-nums">
            <span className="font-medium text-foreground">{(totalCount || cars.length).toLocaleString("fr-BE")}</span> véhicules disponibles
          </p>
          <div className="flex items-center gap-1 p-1 rounded-full bg-card border border-border/40">
            <button
              onClick={() => setViewMode("catalog")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-full text-xs sm:text-sm font-medium transition-all ${
                viewMode === "catalog"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              Catalogue
            </button>
            <button
              onClick={() => setViewMode("match")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-full text-xs sm:text-sm font-medium transition-all ${
                viewMode === "match"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Match
            </button>
          </div>
        </section>

        {/* ── Content — perfect 1/3-column grid, no sidebar ── */}
        <section className="container mx-auto px-6 sm:px-8">
          <AnimatePresence mode="wait">
            {viewMode === "catalog" ? (
              <motion.div
                key="catalog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading && cars.length === 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl bg-card border border-border/40 overflow-hidden">
                        <div className="aspect-video bg-muted animate-pulse" />
                        <div className="p-7 space-y-3">
                          <div className="h-6 w-2/3 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                          <div className="h-9 w-1/2 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : cars.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground mb-6">Aucun véhicule ne correspond à vos critères.</p>
                    <Button onClick={resetFilters} variant="outline" className="rounded-full">
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
                      {cars.map((car) => (
                        <LuxuryCarCard key={car.id} car={car} onClick={handleCarClick} />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="text-center mt-14">
                        <Button
                          onClick={loadMore}
                          disabled={isLoadingMore}
                          variant="outline"
                          size="lg"
                          className="rounded-full px-10"
                        >
                          {isLoadingMore ? "Chargement…" : "Voir plus de véhicules"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="match"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <Suspense fallback={<div className="h-[600px] flex items-center justify-center text-muted-foreground">Chargement du mode Match…</div>}>
                  <SwipeDiscovery
                    vehicles={cars}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onVehicleClick={handleCarClick}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* "Plus de filtres" — side drawer (Sheet) — slides only on click */}
      <MoreFiltersSheet
        open={moreFiltersOpen}
        onOpenChange={setMoreFiltersOpen}
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        resultsCount={totalCount}
        brands={brands}
        models={models}
      />

      <Footer />
    </div>
  );
};

export default Recherche;
