/**
 * Hook for admin report management
 * @module features/admin/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { AdminReport } from '../types/admin.types';

async function fetchReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const reports = data || [];
  const enriched = await Promise.all(
    reports.map(async (r) => {
      const [{ data: car }, { data: profile }] = await Promise.all([
        supabase.from('car_listings_public').select('brand, model').eq('id', r.car_listing_id).maybeSingle(),
        supabase.from('profiles').select('display_name').eq('user_id', r.user_id).maybeSingle(),
      ]);
      return {
        ...r,
        car_brand: car?.brand || 'Inconnu',
        car_model: car?.model || 'Inconnu',
        reporter_name: profile?.display_name ?? undefined,
      } as AdminReport;
    })
  );
  return enriched;
}

export function useAdminReports() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: fetchReports,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('reports').update({ status }).eq('id', id);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: `${status}_report`,
          target_type: 'report',
          target_id: id,
          metadata: { new_status: status } as unknown as Json,
        });
      }

      // DSA Art. 16 §5 — notify the reporter of the decision (fire-and-forget)
      if (status === 'resolved' || status === 'dismissed') {
        const outcome = status === 'resolved' ? 'actioned' : 'rejected';
        supabase.functions
          .invoke('notify-reporter', { body: { report_id: id, outcome } })
          .catch((e) => console.warn('notify-reporter failed', e));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Signalement mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success('Signalement supprimé');
    },
  });

  return {
    ...query,
    updateStatus: updateStatusMutation.mutate,
    deleteReport: deleteMutation.mutate,
    isActing: updateStatusMutation.isPending || deleteMutation.isPending,
  };
}
