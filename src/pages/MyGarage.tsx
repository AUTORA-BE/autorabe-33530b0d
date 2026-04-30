/**
 * Mon Garage — unified personal page with Favorites + Viewing History tabs.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, History, Car } from "lucide-react";
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CarCard, type Vehicle } from "@/features/listings";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { VehicleListingRow } from "@/features/listings/types/vehicle.types";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { HistoryList } from "@/features/garage/components/HistoryList";

type TabValue = "favorites" | "history";

const MyGarage = () => {
  const navigate = useNavigate();
  const vehicleHref = useLocalizedVehicleHref();
  const [searchParams, setSearchParams] = useSearchParams();
  const { favorites, isFavorite, toggleFavorite, clearFavorites, favoritesCount } = useFavorites();
  const { t } = useLanguage();
  const [user, setUser] = useState<boolean | null>(null);

  const initialTab: TabValue = searchParams.get("tab") === "history" ? "history" : "favorites";
  const [tab, setTab] = useState<TabValue>(initialTab);

  // Auth gate
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const isLogged = !!data.session?.user;
      setUser(isLogged);
      if (!isLogged) navigate("/auth?redirect=/garage", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTabChange = (value: string) => {
    const v = value as TabValue;
    setTab(v);
    const params = new URLSearchParams(searchParams);
    params.set("tab", v);
    setSearchParams(params, { replace: true });
  };

  // Favorites query
  const { data: favoriteCars = [], isLoading: favLoading, refetch: refetchFav } = useQuery({
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
    enabled: favorites.length > 0 && user === true,
    staleTime: 5 * 60 * 1000,
  });

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={() => { refetchFav(); }}>
      <div className="page-gradient min-h-screen">
        <SEOHead
          title="Mon Garage"
          description="Retrouvez vos véhicules favoris et votre historique de consultation sur AutoRa."
          url="https://autora.be/garage"
          noIndex
        />
        <Header />
        <main className="container mx-auto px-3 sm:px-6 pt-16 sm:pt-32 pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-5"
          >
            <BackButton to="/" className="mb-2" />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="font-display text-xl sm:text-3xl font-bold text-foreground">
                {t("garage.title")}
              </h1>
              {tab === "favorites" && favoriteCars.length > 0 && (
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

          {/* Tabs */}
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-1 h-auto">
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2 rounded-xl py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <Heart className="w-4 h-4" strokeWidth={1.75} />
                <span>{t("garage.tabs.favorites")}</span>
                {favoritesCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-background/30">
                    {favoritesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 rounded-xl py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <History className="w-4 h-4" strokeWidth={1.75} />
                <span>{t("garage.tabs.history")}</span>
              </TabsTrigger>
            </TabsList>

            {/* Favorites */}
            <TabsContent value="favorites" className="mt-0">
              {favLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[16/10] rounded-[20px] bg-card/60 backdrop-blur-sm border border-border/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : favoriteCars.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-5">
                  <AnimatePresence mode="popLayout">
                    {favoriteCars.map((car, i) => (
                      <motion.div
                        key={car.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3), type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <CarCard
                          car={car}
                          isFavorite={isFavorite(car.id)}
                          onToggleFavorite={toggleFavorite}
                          onClick={(id) => navigate(vehicleHref({ ...car, id }))}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="text-center py-16"
                >
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                    <div className="absolute inset-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                      <Car className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
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
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="mt-0">
              <HistoryList enabled={tab === "history"} />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </PullToRefresh>
  );
};

export default MyGarage;
