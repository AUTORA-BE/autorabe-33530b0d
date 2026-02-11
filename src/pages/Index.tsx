import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { HeroSearch, BrandCarousel, FilterPanel } from "@/features/search";
import { PopularVehicles } from "@/features/listings";
import LoadMoreGrid from "@/components/LoadMoreGrid";
import CarChatbot from "@/components/CarChatbot";
import SEOHead from "@/components/SEOHead";
import SellCarBanner from "@/components/SellCarBanner";
import ScrollReveal from "@/components/ScrollReveal";
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
      <main className="pt-20">
        <ScrollReveal>
          <SellCarBanner />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <HeroSearch onSearch={handleSearch} />
        </ScrollReveal>

        <ScrollReveal delay={0.05} direction="left">
          <BrandCarousel 
            onBrandFilter={(brand) => updateFilter("brand", brand)} 
            selectedBrand={filters.brand} 
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <PopularVehicles
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onVehicleClick={handleCarClick}
          />
        </ScrollReveal>

        <ScrollReveal>
          <section id="results-section" className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
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
                onSortChange={setSortBy}
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
      </main>
      <Footer />
      <CarChatbot />
    </div>
  );
};

export default Index;
