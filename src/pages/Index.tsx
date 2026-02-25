import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { HeroSearch } from "@/features/search";
import SEOHead from "@/components/SEOHead";
import ScrollReveal from "@/components/ScrollReveal";

const SellCarBanner = lazy(() => import("@/components/SellCarBanner"));
const BrandCarousel = lazy(() => import("@/features/search/components/BrandCarousel"));
const FilterPanel = lazy(() => import("@/features/search/components/FilterPanel"));
const PopularVehicles = lazy(() => import("@/features/listings/components/PopularVehicles"));
const LoadMoreGrid = lazy(() => import("@/components/LoadMoreGrid"));
const PricingCTA = lazy(() => import("@/components/PricingCTA"));
const WhyAutoRa = lazy(() => import("@/components/WhyAutoRa"));
const StatsStrip = lazy(() => import("@/components/StatsStrip"));
import { useFilteredInfiniteCarListings } from "@/features/listings";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { 
    cars, isLoading, isLoadingMore, hasMore, loadMore, totalCount,
    filters, updateFilter, resetFilters, sortBy, setSortBy,
    activeFiltersCount, error, refresh,
  } = useFilteredInfiniteCarListings();

  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSearch = (brand: string, model: string, maxPrice: number) => {
    updateFilter("brand", brand);
    updateFilter("searchQuery", model);
    updateFilter("maxPrice", maxPrice);
    setTimeout(() => {
      const resultsSection = document.getElementById("results-section");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

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

        {/* Results grid */}
        <Suspense fallback={<div className="min-h-[400px]" />}>
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 800px" }}>
          <ScrollReveal>
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
              </div>
            </section>
          </ScrollReveal>
        </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
