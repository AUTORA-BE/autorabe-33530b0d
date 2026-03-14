import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header, Footer, BackButton } from "@/shared/components";
import { CarCard, type Vehicle } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { VehicleListingRow } from "@/features/listings/types/vehicle.types";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isFavorite, toggleFavorite, clearFavorites, isAuthenticated } = useFavorites();
  const { t } = useLanguage();

  const { data: favoriteCars = [], isLoading } = useQuery({
    queryKey: ["favorite-vehicles", favorites],
    queryFn: async (): Promise<Vehicle[]> => {
      if (favorites.length === 0) return [];
      const { data, error } = await supabase
        .from("car_listings_public")
        .select("*")
        .in("id", favorites);
      if (error) throw new Error(error.message);
      return (data || []).map((row) => mapListingToVehicle(row as VehicleListingRow));
    },
    enabled: favorites.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="page-gradient">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {t("favorites.title")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {favoriteCars.length} {t("favorites.vehicleCount")}{favoriteCars.length !== 1 ? "s" : ""}
            </p>
          </div>
          {favoriteCars.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearFavorites}>
              {t("favorites.clearAll")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : favoriteCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favoriteCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                isFavorite={isFavorite(car.id)}
                onToggleFavorite={toggleFavorite}
                onClick={(id) => navigate(`/car/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
              {t("favorites.empty")}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6 sm:mb-8">
              {t("favorites.emptyDescription")}
            </p>
            <Button onClick={() => navigate("/")} className="btn-primary-gradient">
              {t("favorites.discover")}
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
