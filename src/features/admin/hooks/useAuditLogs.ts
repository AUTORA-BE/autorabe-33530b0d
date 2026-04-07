/**
 * Hook for viewing audit logs
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
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.action && filters.action !== 'all') {
    query = query.eq('action', filters.action);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Enrich with user names
  const entries = data || [];
  const userIds = [...new Set(entries.map(e => e.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds);

  const nameMap: Record<string, string> = {};
  (profiles || []).forEach(p => { nameMap[p.user_id] = p.display_name || 'Inconnu'; });

  return entries.map(e => ({
    ...e,
    details: e.details as Record<string, unknown> | null,
    user_name: nameMap[e.user_id] || 'Inconnu',
  }));
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters),
  });
}
