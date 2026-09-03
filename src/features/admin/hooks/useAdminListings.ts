/**
 * Hook for admin listing management
 * @module features/admin/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { AdminListing } from '../types/admin.types';

async function fetchListings(): Promise<AdminListing[]> {
  // SECURITY: contact_email/phone/name are revoked from anon/authenticated direct SELECT.
  // Use the SECURITY DEFINER admin RPC which performs an in-function admin role check.
  const { data, error } = await supabase
    .rpc('admin_list_listings_with_contacts', { _limit: 500 });
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

async function sendListingStatusEmail(listing: { id: string; contact_email?: string; contact_name?: string; brand?: string; model?: string; year?: number }, status: 'approved' | 'rejected', reason?: string) {
  try {
    await supabase.functions.invoke('notify-listing-review', {
      body: { listingId: listing.id, status, reason: reason || undefined },
    });
  } catch (e) {
    console.error('Failed to send listing status email:', e);
  }
}


export function useAdminListings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: fetchListings,
  });

  const getListingById = (id: string) =>
    query.data?.find((l) => l.id === id);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      await logAction('approve_listing', id);
      const listing = getListingById(id);
      if (listing) await sendListingStatusEmail(listing, 'approved');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonce approuvée ✓');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.from('car_listings').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      await logAction('reject_listing', id, { reason });
      const listing = getListingById(id);
      if (listing) await sendListingStatusEmail(listing, 'rejected', reason);
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
    onError: (e: Error) => toast.error(e.message || 'Suppression impossible'),
  });

  const markSoldMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').update({ status: 'sold' }).eq('id', id);
      if (error) throw error;
      await logAction('mark_sold', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonce marquée comme vendue ✓');
    },
    onError: (e: Error) => toast.error(e.message || 'Impossible de marquer comme vendue'),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      await logAction('reactivate_listing', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonce réactivée ✓');
    },
    onError: (e: Error) => toast.error(e.message || 'Réactivation impossible'),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('car_listings').update({ status: 'approved' }).in('id', ids);
      if (error) throw error;
      await logAction('bulk_approve', ids.join(','), { count: ids.length });
      const listings = ids.map(getListingById).filter(Boolean);
      await Promise.allSettled(
        listings.map((l) => sendListingStatusEmail(l!, 'approved'))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Annonces approuvées en lot ✓');
    },
    onError: (e: Error) => toast.error(e.message || 'Approbation en lot impossible'),
  });

  const setBoostMutation = useMutation({
    mutationFn: async ({ id, level }: { id: string; level: string | null }) => {
      const HOURS: Record<string, number> = {
        boost_24h: 24,
        boost_48h: 48,
        boost_72h: 72,
        boost_7d: 168,
      };
      const payload = level
        ? {
            boost_level: level,
            boost_expires_at: new Date(Date.now() + (HOURS[level] ?? 24) * 3600_000).toISOString(),
            boost_warning_sent: false,
          }
        : { boost_level: 'none', boost_expires_at: null, boost_warning_sent: false };
      const { error } = await supabase.from('car_listings').update(payload).eq('id', id);
      if (error) throw error;
      await logAction('boost_set', id, { level });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'listings'] });
      toast.success(vars.level ? 'Boost appliqué ✓' : 'Boost retiré');
    },
    onError: (e: Error) => toast.error(e.message || 'Modification du boost impossible'),
  });

  return {

    ...query,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    remove: deleteMutation.mutate,
    markSold: markSoldMutation.mutate,
    reactivate: reactivateMutation.mutate,
    bulkApprove: bulkApproveMutation.mutate,
    isActing:
      approveMutation.isPending ||
      rejectMutation.isPending ||
      deleteMutation.isPending ||
      markSoldMutation.isPending ||
      reactivateMutation.isPending ||
      bulkApproveMutation.isPending,
  };
}
