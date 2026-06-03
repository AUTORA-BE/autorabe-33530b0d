import { useState, lazy, Suspense, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { HeroSearch } from "@/features/search";
import SEOHead from "@/components/SEOHead";
import { organizationSchema, websiteSchema } from "@/lib/seoSchemas";
import {
  CarouselSkeleton,
  WhyAutoRaSkeleton,
  GridSkeleton,
} from "@/components/skeletons/HomeSkeleton";
import { VoiceSearchSummary, type VoiceFilter } from "@/components/VoiceSearchSummary";
import { AnimatePresence } from "framer-motion";
import { PullToRefresh } from "@/components/PullToRefresh";
import { DebugOverlay } from "@/components/DebugOverlay";

const FuelPricesSection = lazy(() => import("@/components/home/FuelPricesSection"));
const FeaturedVehiclesSection = lazy(() => import("@/components/home/FeaturedVehiclesSection"));
const FiscalAdvisorCTA = lazy(() => import("@/components/home/FiscalAdvisorCTA"));

const FilterPanel = lazy(() => import("@/features/search/components/FilterPanel"));
const LoadMoreGrid = lazy(() => import("@/components/LoadMoreGrid"));
const WhyAutoRA = lazy(() => import("@/components/WhyAutoRA"));
const EvBrandSection = lazy(() => import("@/features/search/components/EvBrandSection"));
const ThermalBrandCarousel = lazy(() => import("@/features/search/components/ThermalBrandCarousel"));

const SellCarCTA = lazy(() => import("@/components/SellCarCTA"));
const HomeFAQ = lazy(() => import("@/components/HomeFAQ"));
const TcoFloatingButton = lazy(() => import("@/components/TcoFloatingButton"));

import { useVehicleSearch } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { BUDGET_OPTIONS } from "@/features/search/types/search.types";
import { useBuyerProfile, BuyerProfileModal } from "@/features/tco";

const Index = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [voiceFilters, setVoiceFilters] = useState<VoiceFilter[]>([]);
  const [isDesktopFiltersViewport, setIsDesktopFiltersViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true,
  );
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { 
    cars, isLoading, isLoadingMore, hasMore, loadMore, totalCount,
    filters, updateFilter, resetFilters, sortBy, setSortBy,
    activeFiltersCount, error, refresh,
  } = useVehicleSearch();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktopFiltersViewport(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { profile: buyerProfile, saveProfile } = useBuyerProfile();
  const profileModalRef = useRef<HTMLButtonElement>(null);

  const handleSearch = useCallback((brand: string, model: string, maxPrice: number, maxMileage?: number, fuelType?: string, transmission?: string, euroNorm?: string, color?: string) => {
    // Centralisation : tous les CTA de recherche redirigent vers /recherche
    // avec query params parsés par useFiltersUrlSync → parseFiltersFromParams.
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (model) params.set("q", model);
    if (maxPrice && maxPrice < 1000000) params.set("pmax", String(maxPrice));
    if (maxMileage) params.set("kmax", String(maxMileage));
    if (fuelType) params.set("fuel", fuelType);
    if (transmission) params.set("trans", transmission);
    if (euroNorm) params.set("euro", euroNorm);
    if (color) params.set("color", color);
    const qs = params.toString();
    navigate(qs ? `/recherche?${qs}` : "/recherche");
  }, [navigate]);

  const handleRemoveVoiceFilter = useCallback((type: VoiceFilter['type']) => {
    setVoiceFilters(prev => prev.filter(f => f.type !== type));
    switch (type) {
      case 'brand': updateFilter("brand", ""); break;
      case 'model': updateFilter("searchQuery", ""); break;
      case 'budget': updateFilter("maxPrice", 1000000); break;
      case 'mileage': updateFilter("kmMax", 200000); break;
      case 'fuel': updateFilter("fuelTypes", []); break;
      case 'transmission': updateFilter("transmission", ""); break;
      case 'euroNorm': updateFilter("euroNorm", ""); break;
      case 'color': updateFilter("color", ""); break;
    }
  }, [updateFilter]);

  const handleClearAllVoiceFilters = useCallback(() => {
    setVoiceFilters([]);
    resetFilters();
  }, [resetFilters]);

  const vehicleHref = useLocalizedVehicleHref();
  const handleCarClick = (carId: string) => {
    const car = cars.find((c) => c.id === carId);
    navigate(
      vehicleHref(car ?? { id: carId }),
    );
  };

  return (
    <div className="page-gradient">
      <SEOHead 
        title={language === "nl" ? "AutoRA — De Belgische automarktplaats" : "AutoRA — La marketplace automobile belge"}
        description={language === "nl" 
          ? "AutoRA - De betrouwbare Belgische automarkt. Vind duizenden geverifieerde voertuigen met Car-Pass en gegarandeerde LEZ-compatibiliteit."
          : "AutoRA - La marketplace automobile belge de confiance. Véhicules vérifiés Car-Pass, conformité LEZ garantie et calcul TCO régional."}
        url="https://autora.be"
        jsonLd={[organizationSchema, websiteSchema]}
      />
      <Header />

      <PullToRefresh onRefresh={async () => { refresh(); }}>
      <main className="pb-24 md:pb-0">
        {/* Hero — cinematic parallax with editorial serif text */}
        <HeroSearch onSearch={handleSearch} />

        {/* Unified luxe canvas under the hero — single continuous slate-50 tapis */}
        <div className="relative bg-slate-50 dark:bg-[#0A0A0B] [&_section]:!bg-transparent">
          {/* Hero → canvas dissolve, theme-aware (slate-50 / Elite Black) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-40 z-[1] dark:hidden"
            style={{
              background:
                "linear-gradient(to bottom, hsl(210 40% 98% / 0) 0%, hsl(210 40% 98% / 0.35) 35%, hsl(210 40% 98% / 0.75) 65%, hsl(210 40% 98% / 0.95) 85%, hsl(210 40% 98%) 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-40 z-[1] hidden dark:block"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,11,0) 0%, rgba(10,10,11,0.35) 35%, rgba(10,10,11,1) 65%, rgba(10,10,11,1) 85%, #0A0A0B 100%)",
            }}
          />
          {/* Premium ambient: emerald halo — intensity tunable via --halo-intensity in index.css */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[720px] mix-blend-soft-light dark:mix-blend-screen"
            style={{
              opacity: "var(--halo-intensity)",
              background:
                "radial-gradient(55% 38% at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 65%), radial-gradient(38% 28% at 88% 18%, hsl(var(--primary) / 0.05) 0%, transparent 72%)",
            }}
          />

          {/* Ultra-fine grain for tactile premium texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
              backgroundSize: "160px 160px",
            }}
          />



        {/* Voice search summary */}
        <div className="container mx-auto px-6 sm:px-8">
          <AnimatePresence>
            {voiceFilters.length > 0 && (
              <VoiceSearchSummary
                filters={voiceFilters}
                onRemoveFilter={handleRemoveVoiceFilter}
                onClearAll={handleClearAllVoiceFilters}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 2. Annonces en vedette — remontées juste sous la recherche */}
        <Suspense fallback={<CarouselSkeleton />}>
          <FeaturedVehiclesSection />
        </Suspense>

        {/* 3. Carrousel marques thermiques */}
        <Suspense fallback={null}>
          <ThermalBrandCarousel
            onBrandFilter={(brand) => updateFilter("brand", brand)}
            selectedBrand={filters.brand}
          />
        </Suspense>

        {/* 4. Pourquoi AutoRA — bento grid 2×3 */}
        <Suspense fallback={<WhyAutoRaSkeleton />}>
          <WhyAutoRA />
        </Suspense>

        {/* 5. Marques 100% électriques — dark navy section */}
        <Suspense fallback={null}>
          <EvBrandSection
            onBrandFilter={(brand) => updateFilter("brand", brand)}
            selectedBrand={filters.brand}
          />
        </Suspense>

        {/* 6. Outils fiscaux — Conseiller IA + Prix carburants */}
        <Suspense fallback={<div className="h-96" />}>
          <FiscalAdvisorCTA />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <FuelPricesSection />
        </Suspense>

        {/* 7. Sell Car CTA */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 300px" }}>
          <Suspense fallback={null}>
            <SellCarCTA />
          </Suspense>
        </div>

        {/* 8. Home FAQ */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 600px" }}>
          <Suspense fallback={null}>
            <HomeFAQ />
          </Suspense>
        </div>

        {/* Results section */}
        <section id="results-section" className="container mx-auto px-6 sm:px-8 pb-20 sm:pb-32">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-10">
            {/* Single FilterPanel instance to avoid mobile/PWA double-mount glitches */}
            {isDesktopFiltersViewport && (
              <div className="hidden lg:block" data-filter-variant="desktop">
                <Suspense fallback={null}>
                  <FilterPanel
                    isOpen={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    filters={filters}
                    onFilterChange={updateFilter}
                    onReset={resetFilters}
                    resultsCount={totalCount}
                  />
                </Suspense>
              </div>
            )}

            <Suspense fallback={<GridSkeleton />}>
              <LoadMoreGrid
                cars={cars}
                onOpenFilters={() => setFiltersOpen(true)}
                sortBy={sortBy}
                onSortChange={(sort: string) => setSortBy(sort as import('@/features/listings/types/vehicle.types').VehicleSortOption)}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onCarClick={handleCarClick}
                activeFiltersCount={activeFiltersCount}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                totalCount={totalCount}
                error={error}
                onRetry={refresh}
                buyerProfile={buyerProfile}
                onOpenBuyerProfile={() => profileModalRef.current?.click()}
                onResetFilters={resetFilters}
              />
            </Suspense>
          </div>
        </section>

        {/* Hidden BuyerProfileModal trigger */}
        <BuyerProfileModal
          profile={buyerProfile}
          onSave={saveProfile}
          trigger={<button ref={profileModalRef} className="hidden" />}
        />
        </div>
      </main>


      <Footer />
      </PullToRefresh>

      {/* Mobile FilterPanel — portaled into <body> to escape any
          parent transform/will-change stacking context (PageTransition,
          PullToRefresh) which would otherwise trap position:fixed. */}
      {!isDesktopFiltersViewport && typeof document !== "undefined" &&
        createPortal(
          <div className="lg:hidden" data-filter-variant="mobile">
            <Suspense fallback={null}>
              <FilterPanel
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                filters={filters}
                onFilterChange={updateFilter}
                onReset={resetFilters}
                resultsCount={totalCount}
              />
            </Suspense>
          </div>,
          document.body,
        )}

      {/* Floating widgets */}
      <Suspense fallback={null}>
        <TcoFloatingButton />
      </Suspense>

      {/* Debug overlay — activable via ?debug=1 ou Ctrl+Shift+D */}
      <DebugOverlay filtersOpen={filtersOpen} isDesktopFiltersViewport={isDesktopFiltersViewport} />
    </div>
  );
};

export default Index;
