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
    const newVoiceFilters: VoiceFilter[] = [];
    
    if (brand) {
      updateFilter("brand", brand);
      newVoiceFilters.push({ type: 'brand', label: language === 'nl' ? 'Merk' : 'Marque', value: brand });
    }
    if (model) {
      updateFilter("searchQuery", model);
      newVoiceFilters.push({ type: 'model', label: language === 'nl' ? 'Model' : 'Modèle', value: model });
    }
    if (maxPrice && maxPrice < 1000000) {
      updateFilter("maxPrice", maxPrice);
      const budgetLabel = BUDGET_OPTIONS.find(o => o.value === maxPrice)?.label || `< ${maxPrice.toLocaleString('fr-BE')}€`;
      newVoiceFilters.push({ type: 'budget', label: 'Budget', value: budgetLabel });
    }
    if (maxMileage) {
      updateFilter("kmMax", maxMileage);
      newVoiceFilters.push({ type: 'mileage', label: 'Km max', value: `${maxMileage.toLocaleString('fr-BE')} km` });
    }
    if (fuelType) {
      updateFilter("fuelTypes", [fuelType]);
      const fuelLabels: Record<string, string> = { essence: 'Essence', diesel: 'Diesel', electrique: 'Électrique', hybride: 'Hybride' };
      newVoiceFilters.push({ type: 'fuel', label: language === 'nl' ? 'Brandstof' : 'Carburant', value: fuelLabels[fuelType] || fuelType });
    }
    if (transmission) {
      updateFilter("transmission", transmission);
      newVoiceFilters.push({ type: 'transmission', label: 'Transmission', value: transmission === 'automatique' ? 'Automatique' : 'Manuelle' });
    }
    if (euroNorm) {
      updateFilter("euroNorm", euroNorm);
      newVoiceFilters.push({ type: 'euroNorm', label: 'Norme Euro', value: `Euro ${euroNorm}` });
    }
    if (color) {
      updateFilter("color", color);
      const colorLabels: Record<string, string> = { blanc: 'Blanc', noir: 'Noir', gris: 'Gris', rouge: 'Rouge', bleu: 'Bleu', vert: 'Vert' };
      newVoiceFilters.push({ type: 'color', label: 'Couleur', value: colorLabels[color] || color });
    }
    
    setVoiceFilters(newVoiceFilters);
    
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [updateFilter, language]);

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

        {/* 3. Pourquoi AutoRA — bento grid 2×3 */}
        <Suspense fallback={<WhyAutoRaSkeleton />}>
          <WhyAutoRA />
        </Suspense>

        {/* 4. Outils fiscaux — Conseiller IA + Prix carburants */}
        <Suspense fallback={<div className="h-96" />}>
          <FiscalAdvisorCTA />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <FuelPricesSection />
        </Suspense>

        {/* 5. Sell Car CTA */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 300px" }}>
          <Suspense fallback={null}>
            <SellCarCTA />
          </Suspense>
        </div>

        {/* 6. Home FAQ */}
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
