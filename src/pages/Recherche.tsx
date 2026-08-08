/**
 * Recherche — luxury catalogue search page (glass UI).
 * Follows the active theme (light and dark) via design tokens; the ambient
 * halo and heavy shadows are tinted through theme-aware CSS variables. Image is a plain <img> strictly contained
 * by an overflow-hidden 16:9 frame. All hooks/data flow preserved.
 * @module pages
 */

import { useState, useEffect, lazy, Suspense, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import {
  ShieldCheck, ChevronDown, SlidersHorizontal, Grid3x3, Flame,
  Calendar, Gauge, X, ImageOff, Search, Store,
} from "lucide-react";
import { lezBadgeConfig } from "@/features/listings/constants/lezBadge";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useVehicleSearch } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLocalizedHref, useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { OPEN_MOBILE_SEARCH_EVENT } from "@/features/listings/utils/activeFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { BUDGET_OPTIONS, EURO_NORMS } from "@/features/search/types/search.types";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/features/listings/types/vehicle.types";

const SwipeDiscovery = lazy(() => import("@/features/listings/components/SwipeDiscovery"));
const GaragesSearchView = lazy(() => import("@/features/garages/components/GaragesSearchView"));

type ViewMode = "catalog" | "match" | "garages";

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

/* ─────────────── Card image (plain <img>, strictly contained) ─────────────── */

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const empty = !src || src.trim() === "";

  if (empty || errored) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-foreground/[0.03] text-foreground/40">
        <ImageOff className="h-8 w-8" strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-[0.12em]">Photo à venir</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={1600}
      height={900}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
    />
  );
}

/* ─────────────── Premium Bento Card ─────────────── */

function LuxuryCarCard({
  car,
  featured,
  onClick,
}: {
  car: Vehicle;
  featured?: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onClick(car.id)}
      className={cn(
        "group relative isolate cursor-pointer overflow-hidden rounded-2xl",
        "border border-foreground/5 bg-foreground/[0.03]",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-foreground/[0.05]",
        "hover:shadow-[0_30px_60px_-20px_hsl(var(--shadow-color)/0.7),0_0_0_1px_hsl(var(--primary)/0.18),0_0_50px_-10px_hsl(var(--primary)/0.28)]",
      )}
    >
      {/* Image frame — strictly contained 16:9 */}
      <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-muted">
        <CardImage src={car.image} alt={`${car.brand} ${car.model}`} />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {featured && (
          <span aria-hidden className="search-shimmer pointer-events-none absolute inset-0" />
        )}

        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          {car.isLezCompatible && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-lg backdrop-blur-md",
              lezBadgeConfig.autorise.className,
            )}>
              <lezBadgeConfig.autorise.Icon className="h-3 w-3" strokeWidth={2.5} />
              {lezBadgeConfig.autorise.text}
            </span>
          )}
          {car.hasCarPass && (
            <span className="inline-flex items-center gap-1 rounded-full border-0 bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-lg backdrop-blur-md">
              <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
              Vérifié par AutoRa
            </span>
          )}
        </div>


        <div className="absolute bottom-3 left-3 right-3">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/65">
            {car.brand}
          </p>
          <h3 className="truncate text-xl font-medium tracking-tight text-white">
            {car.model}
          </h3>
        </div>
      </div>

      <div className="relative space-y-4 p-6">
        <div className="flex items-center gap-4 text-[13px] text-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-foreground/45" strokeWidth={2} />
            {car.year}
          </span>
          <span className="text-foreground/20">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-foreground/45" strokeWidth={2} />
            {car.mileage.toLocaleString("fr-BE")} km
          </span>
        </div>

        <div className="flex items-end justify-between border-t border-foreground/5 pt-4">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-foreground/50">
              Prix
            </p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {car.price.toLocaleString("fr-BE")}
              <span className="ml-1 text-xl font-light text-foreground/65">€</span>
            </p>
          </div>
          <span className="rounded-full border border-foreground/10 bg-foreground/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/85 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/15 group-hover:text-primary">
            Voir →
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────── Glass Pill Filter Bar ─────────────── */

interface FilterBarProps {
  filters: ReturnType<typeof useVehicleSearch>["filters"];
  updateFilter: ReturnType<typeof useVehicleSearch>["updateFilter"];
  onOpenMore: () => void;
  shrunk: boolean;
}

function PillFilterBar({ filters, updateFilter, onOpenMore, shrunk }: FilterBarProps) {
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

  const triggerCls = cn(
    "rounded-full bg-transparent text-[13px] font-medium gap-1.5 border-0",
    "text-foreground hover:bg-foreground/[0.08] hover:text-foreground",
    shrunk ? "px-4 h-9" : "px-5 h-10",
  );
  const activeTriggerCls =
    "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary ring-1 ring-inset ring-primary/35";

  const popoverCls =
    "rounded-2xl border border-foreground/10 bg-popover p-6 text-foreground shadow-[0_30px_80px_-20px_hsl(var(--shadow-color)/0.85)]";

  return (
    <div
      className={cn(
        "hidden md:flex items-center gap-1 rounded-full",
        "border border-foreground/10 bg-card/80 backdrop-blur-xl",
        "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]",
        "transition-all duration-300 ease-out",
        shrunk ? "p-1.5 scale-[0.97]" : "p-2",
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={cn(triggerCls, filters.maxPrice < 1000000 && activeTriggerCls)}>
            {budgetLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn(popoverCls, "w-80")} align="start">
          <div className="space-y-5">
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/55">
                Prix maximum
              </label>
              <span className="text-lg font-semibold tabular-nums text-foreground">
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
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-all",
                    filters.maxPrice === b.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/10 text-foreground/70 hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="h-5 w-px bg-foreground/10" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={cn(triggerCls, filters.fuelTypes.length > 0 && activeTriggerCls)}>
            {fuelLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn(popoverCls, "w-72 p-4")} align="start">
          <label className="mb-3 block text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/55">
            Type d'énergie
          </label>
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
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-foreground/10 bg-foreground/[0.02] text-foreground hover:border-primary/50 hover:bg-foreground/[0.06]",
                  )}
                >
                  {f.labelFr}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <span className="h-5 w-px bg-foreground/10" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={cn(triggerCls, filters.kmMax < 500000 && activeTriggerCls)}>
            {kmLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn(popoverCls, "w-80")} align="start">
          <div className="space-y-5">
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/55">
                Kilométrage maximum
              </label>
              <span className="text-lg font-semibold tabular-nums text-foreground">
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
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-all",
                    filters.kmMax === km
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/10 text-foreground/70 hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {km >= 500000 ? "Tous" : `≤ ${(km / 1000).toLocaleString("fr-BE")}k km`}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="h-5 w-px bg-foreground/10" />

      <Button
        variant="ghost"
        onClick={onOpenMore}
        className={cn(
          triggerCls,
          "border border-foreground/10 bg-foreground/[0.04] hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Plus de filtres
      </Button>
    </div>
  );
}

/* ─────────────── More Filters Sheet (dark) ─────────────── */

interface MoreFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ReturnType<typeof useVehicleSearch>["filters"];
  updateFilter: ReturnType<typeof useVehicleSearch>["updateFilter"];
  resetFilters: () => void;
  resultsCount: number;
  brands: string[];
  models: string[];
  isMobile: boolean;
}

function MoreFiltersSheet({
  open, onOpenChange, filters, updateFilter, resetFilters, resultsCount, brands, models, isMobile,
}: MoreFiltersSheetProps) {
  const fieldCls =
    "w-full h-11 px-4 rounded-xl border border-foreground/10 bg-foreground/[0.04] text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.08] focus:ring-2 focus:ring-primary/20";
  const eyebrow =
    "text-[10px] uppercase tracking-[0.15em] text-foreground/60 font-medium block mb-2";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 border-foreground/10 bg-popover p-0 text-foreground",
          isMobile
            ? "h-[100dvh] max-h-[100dvh] w-full rounded-none border-t-0 shadow-none"
            : "w-full border-l shadow-[-40px_0_80px_-20px_hsl(var(--shadow-color)/0.7)] sm:max-w-md",
        )}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-foreground/5 px-6 py-5">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-foreground/55">
              Affiner
            </p>
            <SheetTitle className="mt-1 text-xl font-medium tracking-tight text-foreground">
              Plus de filtres
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Recherche libre — remplace l'ancienne barre collante mobile */}
          <div>
            <label className={eyebrow} htmlFor="filters-search-input">Recherche libre</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" strokeWidth={1.8} />
              <input
                id="filters-search-input"
                type="search"
                inputMode="search"
                value={filters.searchQuery ?? ""}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
                placeholder="Marque, modèle, ville…"
                className={cn(fieldCls, "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={eyebrow}>Marque</label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter("brand", e.target.value)}
                className={fieldCls}
              >
                <option value="" className="bg-popover">Toutes les marques</option>
                {brands.map((b) => <option key={b} value={b} className="bg-popover">{b}</option>)}
              </select>
            </div>
            <div>
              <label className={eyebrow}>Modèle</label>
              <select
                value={filters.model}
                onChange={(e) => updateFilter("model", e.target.value)}
                disabled={!filters.brand}
                className={cn(fieldCls, "disabled:opacity-50")}
              >
                <option value="" className="bg-popover">
                  {filters.brand ? "Tous les modèles" : "Choisissez une marque"}
                </option>
                {models.map((m) => <option key={m} value={m} className="bg-popover">{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={eyebrow}>Ville</label>
            <input
              type="text"
              value={filters.location ?? ""}
              onChange={(e) => updateFilter("location", e.target.value)}
              placeholder="Ex : Bruxelles, Liège, Anvers…"
              className={fieldCls}
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className={cn(eyebrow, "mb-0")}>Budget</label>
              <span className="text-xs tabular-nums text-foreground/55">
                {filters.minPrice.toLocaleString("fr-BE")} € – {filters.maxPrice.toLocaleString("fr-BE")} €
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={filters.minPrice || ""}
                onChange={(e) => updateFilter("minPrice", Math.max(0, Number(e.target.value) || 0))}
                placeholder="Min €"
                className={fieldCls}
              />
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={filters.maxPrice === 1000000 ? "" : filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", Number(e.target.value) || 1000000)}
                placeholder="Max €"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={eyebrow}>Carburant</label>
            <div className="grid grid-cols-2 gap-2">
              {FUEL_OPTIONS.map((f) => {
                const active = filters.fuelTypes?.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      const current = filters.fuelTypes ?? [];
                      const next = active
                        ? current.filter((x) => x !== f.id)
                        : [...current, f.id];
                      updateFilter("fuelTypes", next);
                    }}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-medium transition-all",
                      active
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-foreground/10 bg-foreground/[0.02] text-foreground hover:border-primary/50 hover:bg-foreground/[0.06]",
                    )}
                  >
                    {f.labelFr}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className={cn(eyebrow, "mb-0")}>Année</label>
              <span className="text-xs tabular-nums text-foreground/55">
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
                  <option key={y} value={y} className="bg-popover">De {y}</option>
                ))}
              </select>
              <select
                value={filters.yearMax}
                onChange={(e) => updateFilter("yearMax", Number(e.target.value))}
                className={fieldCls}
              >
                {Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR + 1 - i).map((y) => (
                  <option key={y} value={y} className="bg-popover">À {y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={eyebrow}>Transmission</label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSMISSION_OPTIONS.map((t) => {
                const active = filters.transmission === t.id;
                return (
                  <button
                    key={t.id || "all"}
                    onClick={() => updateFilter("transmission", t.id)}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-medium transition-all",
                      active
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-foreground/10 bg-foreground/[0.02] text-foreground hover:border-primary/50 hover:bg-foreground/[0.06]",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={eyebrow}>Norme Euro (LEZ)</label>
            <select
              value={filters.euroNorm}
              onChange={(e) => updateFilter("euroNorm", e.target.value)}
              className={fieldCls}
            >
              <option value="" className="bg-popover">Toutes</option>
              {EURO_NORMS.map((n) => (
                <option key={n} value={n} className="bg-popover">{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={eyebrow}>Couleur</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => {
                const active = filters.color === c.id;
                return (
                  <button
                    key={c.id || "all"}
                    onClick={() => updateFilter("color", c.id)}
                    className={cn(
                      "h-9 rounded-full border px-4 text-xs font-medium transition-all",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/10 bg-foreground/[0.02] text-foreground hover:border-primary/50 hover:bg-foreground/[0.06]",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-foreground/5 pt-4">
            <Label htmlFor="lez-only" className="cursor-pointer text-sm font-medium text-foreground">
              Uniquement compatibles LEZ
            </Label>
            <Checkbox
              id="lez-only"
              checked={filters.lezOnly}
              onCheckedChange={(v) => updateFilter("lezOnly", v === true)}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 border-t border-foreground/5 bg-popover px-6 py-4">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="h-11 flex-1 rounded-full border-foreground/10 bg-transparent text-foreground hover:bg-foreground/[0.06]"
          >
            Réinitialiser
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-full bg-primary text-primary-foreground shadow-[0_15px_40px_-10px_hsl(var(--primary)/0.55)] hover:bg-primary/90"
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
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>("catalog");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [shrunk, setShrunk] = useState(false);
  const brands = useMemo(() => getAllBrands(), []);

  const {
    cars, isLoading, hasMore, loadMore, isLoadingMore, totalCount,
    filters, updateFilter, resetFilters,
  } = useVehicleSearch();

  const { isFavorite, toggleFavorite } = useFavorites();
  const vehicleHref = useLocalizedVehicleHref();
  const localizedHref = useLocalizedHref();

  useEffect(() => {
    if (filters.brand) getModelsByBrand(filters.brand).then(setModels);
    else setModels([]);
  }, [filters.brand]);

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 96);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // La barre flottante mobile ouvre ce panneau (plus de barre collante).
  useEffect(() => {
    const open = () => setMoreFiltersOpen(true);
    window.addEventListener(OPEN_MOBILE_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_MOBILE_SEARCH_EVENT, open);
  }, []);

  const handleCarClick = (id: string) => {
    const car = cars.find((c) => c.id === id);
    navigate(vehicleHref(car ?? { id }));
  };

  const title =
    language === "nl" ? "AutoRA — Tweedehands auto's kopen in België"
    : language === "en" ? "AutoRA — Used cars marketplace in Belgium"
    : language === "de" ? "AutoRA — Gebrauchtwagen-Marktplatz in Belgien"
    : "AutoRA — Marketplace de voitures d'occasion en Belgique";

  const subtitle = (count: number) => {
    const n = count.toLocaleString("fr-BE");
    const one = count === 1;
    return language === "nl"
      ? `Ontdek ${n} geverifieerd${one ? "" : "e"} voertuig${one ? "" : "en"}, Car-Pass gegarandeerd en klaar om in België te rijden.`
      : language === "en"
      ? `Discover ${n} verified vehicle${one ? "" : "s"}, Car-Pass guaranteed and ready to drive in Belgium.`
      : language === "de"
      ? `Entdecken Sie ${n} geprüfte${one ? "s" : ""} Fahrzeug${one ? "" : "e"}, Car-Pass garantiert und bereit für die Straße in Belgien.`
      : `Découvrez ${n} véhicule${one ? "" : "s"} vérifié${one ? "" : "s"}, garanti${one ? "" : "s"} Car-Pass et prêt${one ? "" : "s"} à rouler en Belgique.`;
  };

  const eyebrow =
    language === "nl" ? "Marktplaats · Geselecteerd"
    : language === "en" ? "Marketplace · Curated"
    : language === "de" ? "Marktplatz · Kuratiert"
    : "Marketplace · Sélection certifiée";

  // Le <title> et la <meta description> étaient figés en français sur les 4
  // langues : Google indexait /nl/zoeken et /de/suche avec un titre FR.
  const seoTitle =
    language === "nl" ? "Een auto zoeken | AutoRA"
    : language === "en" ? "Search for a car | AutoRA"
    : language === "de" ? "Ein Auto suchen | AutoRA"
    : "Rechercher une voiture | AutoRA";

  const seoDescription =
    language === "nl" ? "Premium catalogus van tweedehands voertuigen in België. Car-Pass gecertificeerd, LEZ geverifieerd, transparante prijs."
    : language === "en" ? "Premium catalogue of used vehicles in Belgium. Car-Pass certified, LEZ verified, transparent pricing."
    : language === "de" ? "Premium-Katalog für Gebrauchtwagen in Belgien. Car-Pass zertifiziert, LEZ geprüft, transparenter Preis."
    : "Catalogue premium de véhicules d'occasion en Belgique. Car-Pass certifié, LEZ vérifiée, prix transparent.";

  return (
    // Force le scope "dark" sur toute la page Recherche (incluant les portails Popover/Sheet enfants)
    // pour éviter les contrastes cassés en mode Light, tant que la refonte light n'est pas faite.
    <div className="page-gradient relative text-foreground bg-background">
      {/* Ambient halo — extremely subtle, no white tracery, no grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle 800px at 50% 18%, hsl(var(--primary) / 0.08) 0%, transparent 55%), radial-gradient(circle 1200px at 50% 90%, hsl(var(--search-halo) / 0.6) 0%, transparent 70%)",
        }}
      />

      <SEOHead
        title={seoTitle}
        description={seoDescription}
        url={`https://autora.be${localizedHref("/search")}`}
      />
      <Header />

      <main className="relative pt-24 pb-32 sm:pt-28">
        <section className="container mx-auto mb-10 px-6 text-center sm:mb-14 sm:px-8">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 text-3xl font-light leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-muted-foreground sm:text-base"
          >
            {subtitle(totalCount ?? 0)}
          </motion.p>
        </section>

        <section className="container sticky top-6 z-30 mx-auto mb-10 hidden justify-center px-6 sm:mb-12 sm:px-8 md:flex">
          <PillFilterBar
            filters={filters}
            updateFilter={updateFilter}
            onOpenMore={() => setMoreFiltersOpen(true)}
            shrunk={shrunk}
          />
        </section>


        <section aria-labelledby="results-heading" className="container mx-auto mb-8 flex items-center justify-between px-6 sm:px-8">
          <h2 id="results-heading" className="sr-only">Véhicules disponibles</h2>
          <p className="text-xs font-light tabular-nums text-foreground/70 sm:text-sm">
            <span className="font-semibold text-foreground">
              {(totalCount || cars.length).toLocaleString("fr-BE")}
            </span>{" "}
            {(totalCount || cars.length) === 1 ? "véhicule disponible" : "véhicules disponibles"}
          </p>
          <div className="flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/[0.04] p-1">
            <button
              onClick={() => setViewMode("catalog")}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all sm:px-4 sm:text-sm",
                viewMode === "catalog"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/65 hover:text-foreground",
              )}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
              Catalogue
            </button>
            <button
              onClick={() => setViewMode("match")}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all sm:px-4 sm:text-sm",
                viewMode === "match"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/65 hover:text-foreground",
              )}
            >
              <Flame className="h-3.5 w-3.5" />
              Match
            </button>
            <button
              onClick={() => setViewMode("garages")}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all sm:px-4 sm:text-sm",
                viewMode === "garages"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/65 hover:text-foreground",
              )}
            >
              <Store className="h-3.5 w-3.5" />
              Garages
            </button>
          </div>
        </section>

        {/* Bento grid — 3 cols PC / 1 col mobile / gap-10 */}
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
                  <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="overflow-hidden rounded-2xl border border-foreground/5 bg-foreground/[0.03]">
                        <div className="aspect-video animate-pulse bg-foreground/[0.04]" />
                        <div className="space-y-3 p-6">
                          <div className="h-6 w-2/3 animate-pulse rounded bg-foreground/[0.04]" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/[0.04]" />
                          <div className="h-9 w-1/2 animate-pulse rounded bg-foreground/[0.04]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : cars.length === 0 ? (
                  <div className="mx-auto max-w-md rounded-2xl border border-foreground/5 bg-foreground/[0.03] px-8 py-12 text-center">
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.04] text-foreground/70">
                      <span className="text-xl">∅</span>
                    </div>
                    <h3 className="text-base font-medium text-foreground">
                      Aucun véhicule ne correspond à vos critères
                    </h3>
                    <p className="mt-2 text-[13px] text-foreground/65">
                      Élargissez vos critères ou réinitialisez les filtres.
                    </p>
                    <Button
                      onClick={resetFilters}
                      className="mt-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                      {cars.map((car, i) => (
                        <LuxuryCarCard
                          key={car.id}
                          car={car}
                          featured={i < 3}
                          onClick={handleCarClick}
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="mt-14 text-center">
                        <Button
                          onClick={loadMore}
                          disabled={isLoadingMore}
                          variant="outline"
                          size="lg"
                          className="rounded-full border-foreground/10 bg-foreground/[0.04] px-10 text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                        >
                          {isLoadingMore ? "Chargement…" : "Voir plus de véhicules"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : viewMode === "match" ? (
              <motion.div
                key="match"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <Suspense fallback={<div className="flex h-[600px] items-center justify-center text-foreground/65">Chargement du mode Match…</div>}>
                  <SwipeDiscovery
                    vehicles={cars}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onVehicleClick={handleCarClick}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="garages"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
              >
                <Suspense fallback={<div className="flex h-[400px] items-center justify-center text-foreground/65">Chargement des garages…</div>}>
                  <GaragesSearchView />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <MoreFiltersSheet
        open={moreFiltersOpen}
        onOpenChange={setMoreFiltersOpen}
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        resultsCount={totalCount}
        brands={brands}
        models={models}
        isMobile={isMobile}
      />

      <Footer />
    </div>
  );
};

export default Recherche;
