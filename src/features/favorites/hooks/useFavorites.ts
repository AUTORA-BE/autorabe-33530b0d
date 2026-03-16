/**
 * React Query hook for managing user favorites via Supabase
 * Falls back to localStorage for unauthenticated users
 * @module features/favorites/hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchFavorites, addFavorite, removeFavorite } from "../api/favoriteQueries";
import type { User } from "@supabase/supabase-js";

const FAVORITES_QUERY_KEY = ["favorites"] as const;
const LOCAL_KEY = "autora_favorites";

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // Invalidate on auth change so we refetch from Supabase
        queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      },
    );
    return () => subscription.unsubscribe();
  }, [queryClient]);

  // --- Supabase-backed query (authenticated) ---
  const { data: dbFavorites = [] } = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: fetchFavorites,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // --- localStorage fallback (guest) ---
  const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(localFavorites));
    }
  }, [localFavorites, user]);

  // Derived list of car_listing_ids
  const favoriteIds: string[] = user
    ? dbFavorites.map((f) => f.car_listing_id)
    : localFavorites;

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
      // Prevent double-click while mutation is in flight
      if (isToggling) return;

      if (user) {
        if (isFavorite(carId)) {
          removeMutation.mutate(carId);
        } else {
          addMutation.mutate(carId);
        }
      } else {
        // Guest: localStorage
        setLocalFavorites((prev) =>
          prev.includes(carId) ? prev.filter((id) => id !== carId) : [...prev, carId],
        );
      }
    },
    [user, isFavorite, addMutation, removeMutation, isToggling],
  );

  const clearFavorites = useCallback(() => {
    if (!user) {
      setLocalFavorites([]);
    }
    // For authenticated users, clearing all is rarely needed; skip for now
  }, [user]);

  return {
    favorites: favoriteIds,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    favoritesCount: favoriteIds.length,
    isAuthenticated: !!user,
  };
};
