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
  if (!listing.contact_email) return;
  try {
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'listing-status',
        recipientEmail: listing.contact_email,
        idempotencyKey: `listing-status-${listing.id}-${status}`,
        templateData: {
          contactName: listing.contact_name || undefined,
          brand: listing.brand || undefined,
          model: listing.model || undefined,
          year: listing.year?.toString() || undefined,
          status,
          reason: reason || undefined,
        },
      },
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
