/**
 * Hook for viewing admin activity logs.
 * Reads `admin_actions` (where every admin mutation is recorded) and
 * enriches with admin display names.
 * @module features/admin/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AuditLogEntry } from '../types/admin.types';

interface AuditLogFilters {
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

async function fetchAuditLogs(filters: AuditLogFilters): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('admin_actions')
    .select('id, admin_id, action_type, target_type, target_id, reason, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.action && filters.action !== 'all') {
    query = query.eq('action_type', filters.action);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const entries = data || [];
  const adminIds = [...new Set(entries.map(e => e.admin_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', adminIds);

  const nameMap: Record<string, string> = {};
  (profiles || []).forEach(p => { nameMap[p.user_id] = p.display_name || 'Admin'; });

  return entries.map(e => ({
    id: e.id,
    user_id: e.admin_id,
    action: e.action_type,
    details: {
      ...(e.metadata as Record<string, unknown> | null ?? {}),
      target_type: e.target_type,
      target_id: e.target_id,
      ...(e.reason ? { reason: e.reason } : {}),
    },
    ip_hash: null,
    created_at: e.created_at,
    user_name: nameMap[e.admin_id] || 'Admin',
  }));
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters),
  });
}
