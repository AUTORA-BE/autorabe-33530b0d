/**
 * Hook to check if the current user has admin role.
 * Uses React Query so the result is shared/cached across components
 * (Header, CarDetail, Settings, useFeatureAccess) instead of issuing
 * a fresh RPC call per consumer.
 * @module hooks
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useIsAdmin = (userId: string | undefined): boolean => {
  const { data } = useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId!,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
  });

  return !!data;
};
