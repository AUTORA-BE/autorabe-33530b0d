import { useState, lazy, Suspense, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { HeroSearch } from "@/features/search";
import SEOHead from "@/components/SEOHead";
import {
  CarouselSkeleton,
  TrustBarSkeleton,
  WhyAutoRaSkeleton,
  TestimonialsSkeleton,
  BrandCarouselSkeleton,
  GridSkeleton,
} from "@/components/skeletons/HomeSkeleton";
import ScrollReveal from "@/components/ScrollReveal";
import { VoiceSearchSummary, type VoiceFilter } from "@/components/VoiceSearchSummary";
import { AnimatePresence } from "framer-motion";
import { PullToRefresh } from "@/components/PullToRefresh";

const SellCarBanner = lazy(() => import("@/components/SellCarBanner"));
const EarlyAccessBanner = lazy(() => import("@/components/EarlyAccessBanner"));
const TrustBar = lazy(() => import("@/components/TrustBar"));
const BrandCarousel = lazy(() => import("@/features/search/components/BrandCarousel"));
const FilterPanel = lazy(() => import("@/features/search/components/FilterPanel"));
const PopularVehicles = lazy(() => import("@/features/listings/components/PopularVehicles"));
const SwipeDiscovery = lazy(() => import("@/features/listings/components/SwipeDiscovery"));
const LoadMoreGrid = lazy(() => import("@/components/LoadMoreGrid"));
const WhyAutoRa = lazy(() => import("@/components/WhyAutoRa"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const SellCarCTA = lazy(() => import("@/components/SellCarCTA"));
const PricingCTA = lazy(() => import("@/components/PricingCTA"));
const CarChatbot = lazy(() => import("@/components/CarChatbot"));
const TcoFloatingButton = lazy(() => import("@/components/TcoFloatingButton"));

import { useVehicleSearch } from "@/features/listings";
import { usePopularVehicles } from "@/features/listings/hooks/usePopularVehicles";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "@/features/search/types/search.types";
import { useBuyerProfile, BuyerProfileModal } from "@/features/tco";

const Index = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [voiceFilters, setVoiceFilters] = useState<VoiceFilter[]>([]);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { 
    cars, isLoading, isLoadingMore, hasMore, loadMore, totalCount,
    filters, updateFilter, resetFilters, sortBy, setSortBy,
    activeFiltersCount, error, refresh,
  } = useVehicleSearch();

  const { isFavorite, toggleFavorite } = useFavorites();
  const { vehicles: popularVehicles } = usePopularVehicles({ limit: 12 });
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
      case 'budget': updateFilter("maxPrice", 200000); break;
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

  const handleCarClick = (carId: string) => navigate(`/car/${carId}`);

  return (
    <div className="page-gradient">
      <SEOHead 
        title={language === "nl" ? "AutoRa — De Belgische automarktplaats" : "AutoRa — La marketplace automobile belge"}
        description={language === "nl" 
          ? "AutoRa - De betrouwbare Belgische automarkt. Vind duizenden geverifieerde voertuigen met Car-Pass en gegarandeerde LEZ-compatibiliteit."
          : "AutoRa - La marketplace automobile belge de confiance. Véhicules vérifiés Car-Pass, conformité LEZ garantie et calcul TCO régional."}
        url="https://autora.be"
      />
      <Header />

      <PullToRefresh onRefresh={async () => { refresh(); }}>
      <main style={{ paddingTop: 'calc(5rem + var(--safe-area-top, 0px))' }} className="pb-20 md:pb-0">
        {/* 0. Early Access Banner */}
        <Suspense fallback={null}>
          <EarlyAccessBanner />
        </Suspense>

        {/* 1. Sell banner (dismissable) */}
        <Suspense fallback={<div className="h-[60px] sm:h-[72px]" />}>
          <SellCarBanner />
        </Suspense>

        {/* 2. Hero — immersive search + trust */}
        <HeroSearch onSearch={handleSearch} />

        {/* Voice search summary */}
        <div className="container mx-auto px-4 sm:px-6">
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

        {/* 3. Trust Bar — social proof badges */}
        <Suspense fallback={<TrustBarSkeleton />}>
          <TrustBar />
        </Suspense>

        {/* Swipe Discovery — mobile only */}
        <Suspense fallback={null}>
          <SwipeDiscovery
            vehicles={popularVehicles}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onVehicleClick={handleCarClick}
          />
        </Suspense>

        {/* 4. Why AutoRa — trust pillars */}
        <Suspense fallback={<WhyAutoRaSkeleton />}>
          <WhyAutoRa />
        </Suspense>

        {/* 5. Popular vehicles */}
        <Suspense fallback={<CarouselSkeleton />}>
          <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
            <PopularVehicles
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onVehicleClick={handleCarClick}
            />
          </div>
        </Suspense>

        {/* 6. Brand carousel */}
        <Suspense fallback={<BrandCarouselSkeleton />}>
          <ScrollReveal delay={0.05} direction="left">
            <BrandCarousel 
              onBrandFilter={(brand) => updateFilter("brand", brand)} 
              selectedBrand={filters.brand} 
            />
          </ScrollReveal>
        </Suspense>

        {/* 7. Testimonials */}
        <Suspense fallback={<TestimonialsSkeleton />}>
          <TestimonialsSection />
        </Suspense>

        {/* 8. Sell Car CTA */}
        <Suspense fallback={null}>
          <SellCarCTA />
        </Suspense>

        {/* 9. Pricing CTA */}
        <Suspense fallback={null}>
          <ScrollReveal delay={0.1}>
            <PricingCTA />
          </ScrollReveal>
        </Suspense>

        {/* 10. Results section */}
        <section id="results-section" className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-24">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
            <FilterPanel
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
              resultsCount={totalCount}
            />

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

      {/* Floating buttons — only on homepage, aligned bottom-right & bottom-left */}
      <Suspense fallback={null}>
        <TcoFloatingButton />
      </Suspense>
      <Suspense fallback={null}>
        <CarChatbot />
      </Suspense>
    </div>
  );
};

export default Index;
