import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header, Footer } from "@/shared/components";
import { CarCard, vehicleQueries, type Vehicle } from "@/features/listings";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { VehicleListingRow } from "@/features/listings/types/vehicle.types";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isFavorite, toggleFavorite, clearFavorites } = useFavorites();

  // Fetch only the favorited vehicles by IDs
  const { data: favoriteCars = [], isLoading } = useQuery({
    queryKey: ['favorites', favorites],
    queryFn: async (): Promise<Vehicle[]> => {
      if (favorites.length === 0) return [];
      const { data, error } = await supabase
        .from('car_listings_public')
        .select('*')
        .in('id', favorites);
      if (error) throw new Error(error.message);
      return (data || []).map(row => mapListingToVehicle(row as VehicleListingRow));
    },
    enabled: favorites.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="page-gradient">
      <Header />
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Mes Favoris
            </h1>
            <p className="text-muted-foreground">
              {favoriteCars.length} véhicule{favoriteCars.length !== 1 ? "s" : ""} sauvegardé
              {favoriteCars.length !== 1 ? "s" : ""}
            </p>
          </div>
          {favoriteCars.length > 0 && (
            <Button variant="outline" onClick={clearFavorites}>
              Tout supprimer
            </Button>
          )}
        </div>

        {favoriteCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Aucun favori
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Ajoutez des véhicules à vos favoris en cliquant sur le cœur pour les
              retrouver facilement ici.
            </p>
            <Button onClick={() => navigate("/")} className="btn-primary-gradient">
              Découvrir les véhicules
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
