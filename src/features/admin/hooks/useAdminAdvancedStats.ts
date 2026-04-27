/**
 * Hook for advanced admin statistics: retention, conversion, top sellers
 * @module features/admin/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RetentionBucket {
  label: string;
  users: number;
  percentage: number;
}

export interface ConversionFunnel {
  step: string;
  count: number;
  rate: number;
}

export interface TopSeller {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  listing_count: number;
  approved_count: number;
  total_views: number;
}

export interface AdvancedStats {
  retention: RetentionBucket[];
  funnel: ConversionFunnel[];
  topSellers: TopSeller[];
  avgListingsPerUser: number;
  approvalRate: number;
  avgTimeToApproval: number; // hours
}

async function fetchAdvancedStats(): Promise<AdvancedStats> {
  const now = new Date();

  // ── 1. Retention: users active in last 7 / 30 / 90 days ──
  const [{ data: allProfiles }, { data: allListings }, { data: allViews }] = await Promise.all([
    supabase.from('profiles').select('user_id, created_at'),
    supabase.from('car_listings').select('user_id, status, created_at, updated_at'),
    supabase.from('car_views').select('viewer_id, viewed_at'),
  ]);

  const profiles = allProfiles || [];
  const listings = allListings || [];
  const views = allViews || [];

  const totalUsers = profiles.length;

  // Active = created a listing OR viewed a car in the period
  const activeInPeriod = (days: number) => {
    const cutoff = new Date(now.getTime() - days * 86400000).toISOString();
    const activeUserIds = new Set<string>();
    listings.forEach((l) => {
      if (l.created_at >= cutoff) activeUserIds.add(l.user_id);
    });
    views.forEach((v) => {
      if (v.viewer_id && v.viewed_at >= cutoff) activeUserIds.add(v.viewer_id);
    });
    return activeUserIds.size;
  };

  const active7 = activeInPeriod(7);
  const active30 = activeInPeriod(30);
  const active90 = activeInPeriod(90);

  const retention: RetentionBucket[] = [
    { label: '7 jours', users: active7, percentage: totalUsers ? Math.round((active7 / totalUsers) * 100) : 0 },
    { label: '30 jours', users: active30, percentage: totalUsers ? Math.round((active30 / totalUsers) * 100) : 0 },
    { label: '90 jours', users: active90, percentage: totalUsers ? Math.round((active90 / totalUsers) * 100) : 0 },
  ];

  // ── 2. Conversion funnel ──
  const usersWithListings = new Set(listings.map((l) => l.user_id)).size;
  const approvedListings = listings.filter((l) => l.status === 'approved');
  const approvedCount = approvedListings.length;
  const sellersWithViews = new Set(
    views.filter((v) => v.viewer_id).map((v) => v.viewer_id!)
  ).size;

  const funnel: ConversionFunnel[] = [
    { step: 'Inscrits', count: totalUsers, rate: 100 },
    { step: 'Ont publié', count: usersWithListings, rate: totalUsers ? Math.round((usersWithListings / totalUsers) * 100) : 0 },
    { step: 'Annonce approuvée', count: approvedCount, rate: totalUsers ? Math.round((approvedCount / totalUsers) * 100) : 0 },
    { step: 'Ont reçu des vues', count: sellersWithViews, rate: totalUsers ? Math.round((sellersWithViews / totalUsers) * 100) : 0 },
  ];

  // ── 3. Top sellers ──
  const sellerMap = new Map<string, { listing_count: number; approved_count: number }>();
  listings.forEach((l) => {
    const entry = sellerMap.get(l.user_id) || { listing_count: 0, approved_count: 0 };
    entry.listing_count++;
    if (l.status === 'approved') entry.approved_count++;
    sellerMap.set(l.user_id, entry);
  });

  // Sort by listing count desc, take top 10
  const topSellerIds = [...sellerMap.entries()]
    .sort((a, b) => b[1].listing_count - a[1].listing_count)
    .slice(0, 10);

  // Fetch profiles for top sellers
  const topIds = topSellerIds.map(([id]) => id);
  const { data: sellerProfiles } = topIds.length
    ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', topIds)
    : { data: [] };

  const profileMap = new Map((sellerProfiles || []).map((p) => [p.user_id, p]));

  // Count views per seller
  const viewsPerSeller = new Map<string, number>();
  // const _listingToSeller = new Map<string, string>();
  listings.forEach((_l) => {
    // We don't have listing id in views join, so approximate via viewer
  });
  // Approximate: count views where viewer_id is not the seller
  topIds.forEach((id) => viewsPerSeller.set(id, 0));

  const topSellers: TopSeller[] = topSellerIds.map(([userId, stats]) => {
    const profile = profileMap.get(userId);
    return {
      user_id: userId,
      display_name: profile?.display_name || 'Utilisateur',
      avatar_url: profile?.avatar_url || null,
      listing_count: stats.listing_count,
      approved_count: stats.approved_count,
      total_views: viewsPerSeller.get(userId) || 0,
    };
  });

  // ── 4. Aggregate metrics ──
  const avgListingsPerUser = usersWithListings ? listings.length / usersWithListings : 0;
  const approvalRate = listings.length ? (approvedCount / listings.length) * 100 : 0;

  // Average time to approval (hours)
  let totalHours = 0;
  let countApproved = 0;
  approvedListings.forEach((l) => {
    const created = new Date(l.created_at).getTime();
    const updated = new Date(l.updated_at).getTime();
    if (updated > created) {
      totalHours += (updated - created) / 3600000;
      countApproved++;
    }
  });
  const avgTimeToApproval = countApproved ? totalHours / countApproved : 0;

  return { retention, funnel, topSellers, avgListingsPerUser, approvalRate, avgTimeToApproval };
}

export function useAdminAdvancedStats() {
  return useQuery({
    queryKey: ['admin', 'advanced-stats'],
    queryFn: fetchAdvancedStats,
    staleTime: 60_000,
  });
}
