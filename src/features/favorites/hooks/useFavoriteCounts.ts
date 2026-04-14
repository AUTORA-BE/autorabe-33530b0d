/**
 * Hook to fetch public favorite counts for a list of listing IDs.
 * Uses the get_favorite_counts RPC (security definer, public access).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFavoriteCounts(listingIds: string[]) {
  const key = listingIds.slice().sort().join(",");

  const { data } = useQuery({
    queryKey: ["favorite-counts", key],
    queryFn: async () => {
      if (listingIds.length === 0) return {} as Record<string, number>;

      const { data, error } = await supabase.rpc("get_favorite_counts", {
        listing_ids: listingIds,
      } as any);

      if (error) {
        console.error("Failed to fetch favorite counts:", error.message);
        return {} as Record<string, number>;
      }

      const map: Record<string, number> = {};
      for (const row of (data as any[]) || []) {
        map[row.car_listing_id] = Number(row.favorite_count);
      }
      return map;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: listingIds.length > 0,
  });

  return data || {};
}
