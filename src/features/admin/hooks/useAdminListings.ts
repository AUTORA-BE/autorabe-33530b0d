/**
 * Hook for admin listing management
 * @module features/admin/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { AdminListing } from '../types/admin.types';

const LISTING_COLS = 'id, brand, model, year, price, mileage, fuel_type, transmission, location, photos, contact_name, contact_email, created_at, status, seller_type, description, euro_norm, boost_level';

async function fetchListings(): Promise<AdminListing[]> {
  const { data, error } = await supabase
    .from('car_listings')
    .select(LISTING_COLS)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []) as AdminListing[];
}

async function logAction(actionType: string, targetId: string, metadata?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('admin_actions').insert({
    admin_id: user.id,
    action_type: actionType,
    target_type: 'car_listing',
    target_id: targetId,
    metadata: (metadata || {}) as Json,
  });
}

export function useAdminListings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: fetchListings,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      await logAction('approve_listing', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonce approuvée ✓');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      await logAction('reject_listing', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonce rejetée');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').delete().eq('id', id);
      if (error) throw error;
      await logAction('delete_listing', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonce supprimée');
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('car_listings').update({ status: 'approved' }).in('id', ids);
      if (error) throw error;
      await logAction('bulk_approve', ids.join(','), { count: ids.length });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonces approuvées en lot ✓');
    },
  });

  return {
    ...query,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    remove: deleteMutation.mutate,
    bulkApprove: bulkApproveMutation.mutate,
    isActing: approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending || bulkApproveMutation.isPending,
  };
}
