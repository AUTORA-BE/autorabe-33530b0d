/**
 * React Query hook for managing user favorites via Supabase.
 *
 * Guests can click the favorite button — the auth-prompt modal opens
 * (positive friction) and the listing id is replayed automatically once
 * the user authenticates.
 *
 * @module features/favorites/hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchFavorites, addFavorite, removeFavorite } from "../api/favoriteQueries";
import { trackEvent, EVENTS } from "@/lib/analytics";
import { useAuthPrompt, consumePendingFavorite } from "@/features/auth";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const FAVORITES_QUERY_KEY = ["favorites"] as const;

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthPrompt();
  const [user, setUser] = useState<User | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

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

  // Replay a pending favorite stored before the user logged in.
  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = null;
      return;
    }
    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;

    const pendingId = consumePendingFavorite();
    if (!pendingId) return;
    // Defer until the initial favorites query has settled to avoid duplicates.
    queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    addMutation.mutate(pendingId, {
      onSuccess: () => {
        trackEvent(EVENTS.FAVORITE_ADDED, { car_id: pendingId, source: "post_login_replay" });
        toast.success("Ajouté à vos favoris");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isFavorite = useCallback(
    (carId: string) => favoriteIds.includes(carId),
    [favoriteIds],
  );

  const isToggling = addMutation.isPending || removeMutation.isPending;

  const toggleFavorite = useCallback(
    (carId: string) => {
      if (!requireAuth({ reason: "favorite", carId })) return;
      if (isToggling) return;

      const wasFavorite = isFavorite(carId);
      if (!wasFavorite) {
        trackEvent(EVENTS.FAVORITE_ADDED, { car_id: carId });
        addMutation.mutate(carId);
      } else {
        removeMutation.mutate(carId);
      }
    },
    [requireAuth, isFavorite, addMutation, removeMutation, isToggling],
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
