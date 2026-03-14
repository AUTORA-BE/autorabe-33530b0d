/**
 * Supabase queries for favorites feature
 * @module features/favorites/api
 */
import { supabase } from "@/integrations/supabase/client";
import type { Favorite } from "../types/favorites.types";

/** Fetch all favorite IDs for the current user */
export const fetchFavorites = async (): Promise<Favorite[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Favorite[];
};

/** Add a listing to favorites */
export const addFavorite = async (carListingId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, car_listing_id: carListingId });

  if (error) throw new Error(error.message);
};

/** Remove a listing from favorites */
export const removeFavorite = async (carListingId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("car_listing_id", carListingId);

  if (error) throw new Error(error.message);
};
