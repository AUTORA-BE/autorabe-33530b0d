/**
 * Derniers incidents techniques enregistrés par les edge functions.
 * Lecture réservée aux admins par RLS sur public.ops_alerts.
 * @module features/admin/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OpsAlert {
  id: string;
  source: string;
  severity: 'warn' | 'error' | 'critical';
  message: string;
  created_at: string;
  notified_at: string | null;
}

export function useOpsAlerts(limit = 10) {
  return useQuery({
    queryKey: ['admin', 'ops-alerts', limit],
    queryFn: async (): Promise<OpsAlert[]> => {
      const { data, error } = await supabase
        .from('ops_alerts')
        .select('id,source,severity,message,created_at,notified_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as OpsAlert[];
    },
    staleTime: 60_000,
  });
}
