/**
 * Fetches the current user's vehicle view history (deduped, latest first).
 * @module features/garage/hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type {
  Vehicle,
  VehicleListingRow,
} from "@/features/listings/types/vehicle.types";

export interface ViewHistoryItem extends Vehicle {
  lastViewedAt: string;
}

const VIEW_HISTORY_KEY = ["view-history"] as const;

export function useViewHistory(enabled: boolean = true, limit: number = 50) {
  return useQuery({
    queryKey: [...VIEW_HISTORY_KEY, limit],
    queryFn: async (): Promise<ViewHistoryItem[]> => {
      const { data, error } = await supabase.rpc("get_user_view_history", {
        _limit: limit,
      });
      if (error) throw new Error(error.message);
      return (data || []).map((row) => {
        const r = row as VehicleListingRow & { last_viewed_at: string };
        return {
          ...mapListingToVehicle(r),
          lastViewedAt: r.last_viewed_at,
        };
      });
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useClearViewHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("clear_user_view_history");
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
    onSuccess: () => {
      queryClient.setQueryData([...VIEW_HISTORY_KEY, 50], []);
      queryClient.invalidateQueries({ queryKey: VIEW_HISTORY_KEY });
    },
  });
}
