/**
 * Hook for fetching admin dashboard statistics
 * @module features/admin/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardStats } from '../types/admin.types';

async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  const [profiles, listings, reports, messages, subscriptions] = await Promise.all([
    supabase.from('profiles').select('user_id, suspended_at', { count: 'exact' }),
    supabase.from('car_listings').select('id, status', { count: 'exact' }),
    supabase.from('reports').select('id, status', { count: 'exact' }),
    supabase.from('daily_message_counts').select('count').eq('message_date', today),
    supabase.from('subscriptions').select('status').eq('status', 'active'),
  ]);

  const listingsData = listings.data || [];
  const profilesData = profiles.data || [];
  const reportsData = reports.data || [];
  const todayMsgs = (messages.data || []).reduce((sum, m) => sum + (m.count || 0), 0);
  const activeSubs = (subscriptions.data || []).length;

  return {
    totalUsers: profilesData.length,
    totalListings: listingsData.length,
    pendingListings: listingsData.filter(l => l.status === 'pending').length,
    approvedListings: listingsData.filter(l => l.status === 'approved').length,
    pendingReports: reportsData.filter(r => r.status === 'pending').length,
    totalReports: reportsData.length,
    suspendedUsers: profilesData.filter(p => p.suspended_at !== null).length,
    todayMessages: todayMsgs,
    estimatedRevenue: activeSubs * 29,
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });
}
