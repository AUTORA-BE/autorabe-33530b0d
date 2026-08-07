/**
 * Shared user role hook.
 * Single source of truth for `user_roles` reads — deduplicated by TanStack Query
 * so simultaneously mounted consumers (desktop nav, mobile nav, analytics)
 * trigger only one request.
 * @module hooks
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const userRoleQueryKey = (userId: string | undefined | null) =>
  ["user-roles", userId] as const;

export async function fetchUserRole(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return "private";
  return data?.role ?? "private";
}

export function useUserRole(userId: string | undefined | null) {
  return useQuery({
    queryKey: userRoleQueryKey(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: () => fetchUserRole(userId!),
  });
}
