/**
 * Hook for fetching admin chart data (signups, listings, revenue)
 * @module features/admin/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailySignup {
  date: string;
  count: number;
}

export interface WeeklyListing {
  week: string;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getLast12Weeks(): { start: string; label: string }[] {
  const weeks: { start: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeks.push({ start: weekStart.toISOString().split('T')[0], label });
  }
  return weeks;
}

function getLast6Months(): { start: string; end: string; label: string }[] {
  const months: { start: string; end: string; label: string }[] = [];
  const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const start = d.toISOString().split('T')[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    months.push({ start, end, label: labels[d.getMonth()] });
  }
  return months;
}

async function fetchChartData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const weekCutoff = twelveWeeksAgo.toISOString();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6, 1);
  const monthCutoff = sixMonthsAgo.toISOString();

  const [profilesRes, listingsRes, subsRes] = await Promise.all([
    supabase.from('profiles').select('created_at').gte('created_at', cutoff),
    supabase.from('car_listings').select('created_at').gte('created_at', weekCutoff),
    supabase.from('subscriptions').select('created_at, status').gte('created_at', monthCutoff),
  ]);

  // Daily signups (last 30 days)
  const days = getLast30Days();
  const signupMap = new Map<string, number>();
  days.forEach(d => signupMap.set(d, 0));
  (profilesRes.data || []).forEach(p => {
    const day = p.created_at.split('T')[0];
    if (signupMap.has(day)) signupMap.set(day, (signupMap.get(day) || 0) + 1);
  });
  const dailySignups: DailySignup[] = days.map(d => ({
    date: `${new Date(d).getDate()}/${new Date(d).getMonth() + 1}`,
    count: signupMap.get(d) || 0,
  }));

  // Weekly listings (last 12 weeks)
  const weeks = getLast12Weeks();
  const listingsData = listingsRes.data || [];
  const weeklyListings: WeeklyListing[] = weeks.map((w, idx) => {
    const nextStart = idx < weeks.length - 1 ? weeks[idx + 1].start : new Date().toISOString().split('T')[0];
    const count = listingsData.filter(l => {
      const d = l.created_at.split('T')[0];
      return d >= w.start && d < nextStart;
    }).length;
    return { week: w.label, count };
  });

  // Monthly revenue (last 6 months)
  const months = getLast6Months();
  const subsData = subsRes.data || [];
  const monthlyRevenue: MonthlyRevenue[] = months.map(m => {
    const activeSubs = subsData.filter(s => {
      const d = s.created_at.split('T')[0];
      return d >= m.start && d <= m.end && s.status === 'active';
    }).length;
    return { month: m.label, revenue: activeSubs * 29 };
  });

  return { dailySignups, weeklyListings, monthlyRevenue };
}

export function useAdminCharts() {
  return useQuery({
    queryKey: ['admin', 'charts'],
    queryFn: fetchChartData,
    refetchInterval: 60_000,
  });
}
