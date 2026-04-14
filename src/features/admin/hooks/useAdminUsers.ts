/**
 * Hook for admin user management
 * @module features/admin/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { AdminUser } from '../types/admin.types';

async function fetchUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url, phone, garage_name, postal_code, suspended_at, suspended_reason, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: listings } = await supabase.from('car_listings').select('user_id');
  const countMap: Record<string, number> = {};
  (listings || []).forEach(l => { countMap[l.user_id] = (countMap[l.user_id] || 0) + 1; });

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, product_id, status, current_period_end');

  const subMap: Record<string, { product_id: string | null; status: string; current_period_end: string | null }> = {};
  (subs || []).forEach(s => {
    if (s.status === 'active' || !subMap[s.user_id]) {
      subMap[s.user_id] = { product_id: s.product_id, status: s.status, current_period_end: s.current_period_end };
    }
  });

  return (data || []).map(p => ({
    ...p,
    listing_count: countMap[p.user_id] || 0,
    subscription_product_id: subMap[p.user_id]?.product_id ?? null,
    subscription_status: subMap[p.user_id]?.status ?? null,
    subscription_end: subMap[p.user_id]?.current_period_end ?? null,
  }));
}

async function logAction(actionType: string, targetId: string, reason?: string, metadata?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('admin_actions').insert({
    admin_id: user.id,
    action_type: actionType,
    target_type: 'user',
    target_id: targetId,
    reason: reason || null,
    metadata: (metadata || {}) as Json,
  });
}

export function useAdminUsers() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.from('profiles')
        .update({ suspended_at: new Date().toISOString(), suspended_reason: reason })
        .eq('user_id', userId);
      if (error) throw error;
      await logAction('suspend_user', userId, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Utilisateur suspendu');
    },
    onError: () => toast.error('Erreur lors de la suspension'),
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles')
        .update({ suspended_at: null, suspended_reason: null })
        .eq('user_id', userId);
      if (error) throw error;
      await logAction('unsuspend_user', userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Utilisateur réactivé');
    },
    onError: () => toast.error('Erreur lors de la réactivation'),
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, productId, periodEnd }: { userId: string; productId: string | null; periodEnd: string | null }) => {
      // Check if user already has a subscription row
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
        const { error } = await supabase.from('subscriptions')
          .update({
            product_id: productId,
            status: productId ? 'active' : 'inactive',
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        // Need to insert via admin — subscriptions table only allows service_role insert
        // We'll use an edge function or RPC. For now, log the action.
        throw new Error('Aucun abonnement existant. Créez-en un via Stripe.');
      }
      await logAction('update_subscription', userId, `Product: ${productId}, End: ${periodEnd}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Abonnement mis à jour');
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la mise à jour'),
  });

  return {
    ...query,
    suspendUser: suspendMutation.mutate,
    unsuspendUser: unsuspendMutation.mutate,
    updateSubscription: updateSubscriptionMutation.mutate,
    isActing: suspendMutation.isPending || unsuspendMutation.isPending || updateSubscriptionMutation.isPending,
  };
}
