/**
 * Hook for managing user vehicle alerts
 * @module features/alerts/hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { messageKeys } from "@/features/messaging/api/messageKeys";

export interface AlertFilters {
  brand?: string;
  model?: string;
  max_price?: number;
  min_year?: number;
  max_km?: number;
  fuel_types?: string[];
  lez_compatible?: boolean;
  carpass_verified?: boolean;
}

export interface UserAlert {
  id: string;
  user_id: string;
  name: string;
  filters: AlertFilters;
  frequency: "instant" | "daily" | "weekly";
  notify_email: boolean;
  notify_push: boolean;
  active: boolean;
  last_sent_at: string | null;
  match_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertData {
  name: string;
  filters: AlertFilters;
  frequency: "instant" | "daily" | "weekly";
  notify_email?: boolean;
  notify_push?: boolean;
}

/** Fetch all alerts for the current user */
export function useUserAlerts() {
  return useQuery({
    queryKey: messageKeys.alerts(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserAlert[];
    },
  });
}

/** Count active alerts */
export function useActiveAlertCount() {
  return useQuery({
    queryKey: messageKeys.alertsCount(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("user_alerts")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      if (error) return 0;
      return count || 0;
    },
  });
}

/** Create a new alert */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertData: CreateAlertData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("user_alerts")
        .insert([{
          user_id: user.id,
          name: alertData.name,
          filters: alertData.filters as unknown as import("@/integrations/supabase/types").Json,
          frequency: alertData.frequency,
          notify_email: alertData.notify_email ?? true,
          notify_push: alertData.notify_push ?? false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: messageKeys.alertsCount() });
      toast.success("Alerte créée avec succès !");
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'alerte");
    },
  });
}

/** Toggle alert active state */
export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("user_alerts")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: messageKeys.alertsCount() });
    },
  });
}

/** Delete an alert */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["user-alerts-count"] });
      toast.success("Alerte supprimée");
    },
  });
}
