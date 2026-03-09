import { useState, lazy, Suspense, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { HeroSearch } from "@/features/search";
import SEOHead from "@/components/SEOHead";
import ScrollReveal from "@/components/ScrollReveal";
import { VoiceSearchSummary, type VoiceFilter } from "@/components/VoiceSearchSummary";
import { AnimatePresence } from "framer-motion";

const SellCarBanner = lazy(() => import("@/components/SellCarBanner"));
const BrandCarousel = lazy(() => import("@/features/search/components/BrandCarousel"));
const FilterPanel = lazy(() => import("@/features/search/components/FilterPanel"));
const PopularVehicles = lazy(() => import("@/features/listings/components/PopularVehicles"));
const LoadMoreGrid = lazy(() => import("@/components/LoadMoreGrid"));
const PricingCTA = lazy(() => import("@/components/PricingCTA"));
const WhyAutoRa = lazy(() => import("@/components/WhyAutoRa"));
const StatsStrip = lazy(() => import("@/components/StatsStrip"));
import { useVehicleSearch } from "@/features/listings";
import { useFavorites } from "@/hooks/useFavorites";
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
      newVoiceFilters.push({ type: 'mileage', label: language === 'nl' ? 'Km max' : 'Km max', value: `${maxMileage.toLocaleString('fr-BE')} km` });
    }
    if (fuelType) {
      updateFilter("fuelTypes", [fuelType]);
      const fuelLabels: Record<string, string> = { essence: 'Essence', diesel: 'Diesel', electrique: 'Électrique', hybride: 'Hybride' };
      newVoiceFilters.push({ type: 'fuel', label: language === 'nl' ? 'Brandstof' : 'Carburant', value: fuelLabels[fuelType] || fuelType });
    }
    if (transmission) {
      updateFilter("transmission", transmission);
      newVoiceFilters.push({ type: 'transmission', label: language === 'nl' ? 'Versnelling' : 'Transmission', value: transmission === 'automatique' ? 'Automatique' : 'Manuelle' });
    }
    if (euroNorm) {
      updateFilter("euroNorm", euroNorm);
      newVoiceFilters.push({ type: 'euroNorm', label: language === 'nl' ? 'Euro norm' : 'Norme Euro', value: `Euro ${euroNorm}` });
    }
    if (color) {
      updateFilter("color", color);
      const colorLabels: Record<string, string> = { blanc: 'Blanc', noir: 'Noir', gris: 'Gris', rouge: 'Rouge', bleu: 'Bleu', vert: 'Vert', jaune: 'Jaune', orange: 'Orange', marron: 'Marron', beige: 'Beige', argent: 'Argent' };
      newVoiceFilters.push({ type: 'color', label: language === 'nl' ? 'Kleur' : 'Couleur', value: colorLabels[color] || color });
    }
    
    setVoiceFilters(newVoiceFilters);
    
    setTimeout(() => {
      const resultsSection = document.getElementById("results-section");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, [updateFilter, language]);

  const handleRemoveVoiceFilter = useCallback((type: VoiceFilter['type']) => {
    setVoiceFilters(prev => prev.filter(f => f.type !== type));
    
    // Also clear the actual filter
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

  const handleCarClick = (carId: string) => {
    navigate(`/car/${carId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={language === "nl" ? "Vind uw volgende auto" : "Trouvez votre prochaine voiture"}
        description={language === "nl" 
          ? "AutoRa - De betrouwbare Belgische automarkt. Vind duizenden geverifieerde voertuigen met Car-Pass en gegarandeerde LEZ-compatibiliteit."
          : "AutoRa - La marketplace automobile belge de confiance. Trouvez des milliers de véhicules vérifiés avec Car-Pass et compatibilité LEZ garantie."
        }
        url="https://autora.be"
      />
      <Header />
      <main className="pt-16 sm:pt-20 space-y-2 sm:space-y-0">
        {/* Sell banner */}
        <Suspense fallback={<div className="h-[60px] sm:h-[72px]" />}>
          <ScrollReveal>
            <SellCarBanner />
          </ScrollReveal>
        </Suspense>

        {/* Hero */}
        <HeroSearch onSearch={handleSearch} />

        {/* Voice search filter summary */}
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

        {/* Stats strip — social proof between hero and content */}
        <Suspense fallback={<div className="h-[72px] sm:h-[88px]" />}>
          <StatsStrip />
        </Suspense>

        {/* Brand carousel */}
        <Suspense fallback={<div className="min-h-[140px] sm:min-h-[180px]" />}>
          <ScrollReveal delay={0.05} direction="left">
            <BrandCarousel 
              onBrandFilter={(brand) => updateFilter("brand", brand)} 
              selectedBrand={filters.brand} 
            />
          </ScrollReveal>
        </Suspense>

        {/* Popular vehicles */}
        <Suspense fallback={<div className="min-h-[260px] sm:min-h-[300px]" />}>
          <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
            <ScrollReveal delay={0.1}>
              <PopularVehicles
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onVehicleClick={handleCarClick}
              />
            </ScrollReveal>
          </div>
        </Suspense>

        {/* Why AutoRa — trust section */}
        <Suspense fallback={<div className="min-h-[240px] sm:min-h-[300px]" />}>
          <WhyAutoRa />
        </Suspense>

        {/* Pricing CTA */}
        <Suspense fallback={null}>
          <ScrollReveal delay={0.1}>
            <PricingCTA />
          </ScrollReveal>
        </Suspense>

        {/* Results section with sidebar filters */}
        <section id="results-section" className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-24">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
            {/* Filter panel — outside contentVisibility/ScrollReveal to preserve fixed positioning on mobile */}
            <FilterPanel
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
              resultsCount={totalCount}
            />

            {/* Results grid */}
            <Suspense fallback={<div className="min-h-[400px] flex-1" />}>
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
              />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
