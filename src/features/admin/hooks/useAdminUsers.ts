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

  return (data || []).map(p => ({ ...p, listing_count: countMap[p.user_id] || 0 }));
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

  return { ...query, suspendUser: suspendMutation.mutate, unsuspendUser: unsuspendMutation.mutate, isActing: suspendMutation.isPending || unsuspendMutation.isPending };
}
