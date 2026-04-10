/**
 * Hook to fetch admin action history for a specific listing
 * @module features/admin/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ListingAction {
  id: string;
  action_type: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_name: string | null;
}

async function fetchListingHistory(listingId: string): Promise<ListingAction[]> {
  // Fetch actions for this listing
  const { data: actions, error } = await supabase
    .from('admin_actions')
    .select('id, action_type, reason, metadata, created_at, admin_id')
    .eq('target_id', listingId)
    .eq('target_type', 'car_listing')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!actions?.length) return [];

  // Fetch admin display names
  const adminIds = [...new Set(actions.map(a => a.admin_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', adminIds);

  const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

  return actions.map(a => ({
    id: a.id,
    action_type: a.action_type,
    reason: a.reason,
    metadata: a.metadata as Record<string, unknown> | null,
    created_at: a.created_at,
    admin_name: nameMap.get(a.admin_id) || 'Admin',
  }));
}

export function useListingHistory(listingId: string | null) {
  return useQuery({
    queryKey: ['admin', 'listing-history', listingId],
    queryFn: () => fetchListingHistory(listingId!),
    enabled: !!listingId,
  });
}
