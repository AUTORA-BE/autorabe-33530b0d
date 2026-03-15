import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Header, Footer, BackButton } from "@/shared/components";
import { CarCard, type Vehicle } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Car, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { VehicleListingRow } from "@/features/listings/types/vehicle.types";
import { PullToRefresh } from "@/components/PullToRefresh";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type SortMode = "price" | "year" | "brand";

/** Swipeable favorite card wrapper */
function SwipeableCard({
  car,
  isFavorite,
  onToggleFavorite,
  onClick,
  onRemove,
}: {
  car: Vehicle;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0], [0, 0.8, 1]);
  const bgOpacity = useTransform(x, [-200, -80, 0], [1, 0.6, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -120) {
      onRemove(car.id);
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-[20px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, transition: { duration: 0.3 } }}
      layout
    >
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 rounded-[20px] bg-destructive/20 flex items-center justify-end pr-6 z-0"
        style={{ opacity: bgOpacity }}
      >
        <Heart className="w-6 h-6 text-destructive" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className="relative z-10"
        whileTap={{ scale: 0.98 }}
      >
        <CarCard
          car={car}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onClick={onClick}
        />
      </motion.div>
    </motion.div>
  );
}

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isFavorite, toggleFavorite, clearFavorites } = useFavorites();
  const { t } = useLanguage();
  const [sortMode, setSortMode] = useState<SortMode>("price");

  const { data: favoriteCars = [], isLoading, refetch } = useQuery({
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

  const sortedCars = [...favoriteCars].sort((a, b) => {
    if (sortMode === "price") return a.price - b.price;
    if (sortMode === "year") return b.year - a.year;
    return a.brand.localeCompare(b.brand);
  });

  const handleRemove = useCallback(
    (id: string) => {
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const sortChips: { mode: SortMode; label: string }[] = [
    { mode: "price", label: t("filters.budget") || "Prix" },
    { mode: "year", label: t("filters.year") || "Année" },
    { mode: "brand", label: t("filters.brand") || "Marque" },
  ];

  return (
    <PullToRefresh onRefresh={() => { refetch(); }}>
      <div className="page-gradient min-h-screen">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-24">
          {/* Immersive header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-5"
          >
            <BackButton to="/" className="mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {t("favorites.title")}
                </h1>
                {favoriteCars.length > 0 && (
                  <motion.span
                    key={favoriteCars.length}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-destructive/10 text-destructive"
                  >
                    {favoriteCars.length} <Heart className="w-3.5 h-3.5 fill-current" />
                  </motion.span>
                )}
              </div>
              {favoriteCars.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFavorites}
                  className="text-muted-foreground text-xs"
                >
                  {t("favorites.clearAll")}
                </Button>
              )}
            </div>
          </motion.div>

          {/* Sort chips - horizontal scroll */}
          {favoriteCars.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-5"
            >
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {sortChips.map((chip) => (
                    <button
                      key={chip.mode}
                      onClick={() => setSortMode(chip.mode)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.97] ${
                        sortMode === chip.mode
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-card/80 backdrop-blur-sm text-muted-foreground border border-border/50 hover:border-primary/30"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </motion.div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-[16/10] rounded-[20px] bg-card/60 backdrop-blur-sm border border-border/30 animate-pulse"
                />
              ))}
            </div>
          ) : sortedCars.length > 0 ? (
            <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-5 md:space-y-0">
              <AnimatePresence mode="popLayout">
                {sortedCars.map((car, i) => (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {/* Swipe on mobile only, normal card on desktop */}
                    <div className="md:hidden">
                      <SwipeableCard
                        car={car}
                        isFavorite={isFavorite(car.id)}
                        onToggleFavorite={toggleFavorite}
                        onClick={(id) => navigate(`/car/${id}`)}
                        onRemove={handleRemove}
                      />
                    </div>
                    <div className="hidden md:block">
                      <CarCard
                        car={car}
                        isFavorite={isFavorite(car.id)}
                        onToggleFavorite={toggleFavorite}
                        onClick={(id) => navigate(`/car/${id}`)}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-center py-20"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                  <Car className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"
                >
                  <Heart className="w-4 h-4 text-destructive/50" />
                </motion.div>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {t("favorites.empty")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8">
                {t("favorites.emptyDescription")}
              </p>
              <Button
                onClick={() => navigate("/")}
                className="rounded-full px-8 py-3 bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
              >
                {t("favorites.discover")}
              </Button>
            </motion.div>
          )}
        </main>
        <Footer />
      </div>
    </PullToRefresh>
  );
};

export default Favorites;
