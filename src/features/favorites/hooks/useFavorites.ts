/**
 * React Query hook for managing user favorites via Supabase
 * Auth required — guests are redirected to /auth on toggle
 * @module features/favorites/hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchFavorites, addFavorite, removeFavorite } from "../api/favoriteQueries";
import { trackEvent, EVENTS } from "@/lib/analytics";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const FAVORITES_QUERY_KEY = ["favorites"] as const;

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      },
    );
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: dbFavorites = [] } = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: fetchFavorites,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const favoriteIds: string[] = user ? dbFavorites.map((f) => f.car_listing_id) : [];

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
  });

  const isFavorite = useCallback(
    (carId: string) => favoriteIds.includes(carId),
    [favoriteIds],
  );

  const isToggling = addMutation.isPending || removeMutation.isPending;

  const toggleFavorite = useCallback(
    (carId: string) => {
      if (!user) {
        toast.info("Connectez-vous pour ajouter aux favoris", {
          action: { label: "Se connecter", onClick: () => navigate("/auth") },
        });
        return;
      }
      if (isToggling) return;

      const wasFavorite = isFavorite(carId);
      if (!wasFavorite) {
        trackEvent(EVENTS.FAVORITE_ADDED, { car_id: carId });
        addMutation.mutate(carId);
      } else {
        removeMutation.mutate(carId);
      }
    },
    [user, isFavorite, addMutation, removeMutation, isToggling, navigate],
  );

  const clearFavorites = useCallback(() => {
    // No-op for guests; authenticated bulk-clear handled elsewhere if needed
  }, []);

  return {
    favorites: favoriteIds,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    favoritesCount: favoriteIds.length,
    isAuthenticated: !!user,
    isToggling,
  };
};
