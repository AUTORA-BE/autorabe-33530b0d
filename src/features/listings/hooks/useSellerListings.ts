/**
 * Hook for managing seller's vehicle listings and stats
 * @module features/listings/hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { SellerListing, DashboardTotals, DailyStats, ChartPeriod } from "../types/sellerDashboard.types";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Fetches seller listings with stats
 */
async function fetchSellerListings(userId: string): Promise<{
  listings: SellerListing[];
  totals: DashboardTotals;
}> {
  // Get user's listings
  const { data: userListings, error } = await supabase
    .from("car_listings")
    .select("id, brand, model, year, price, status, photos, created_at, euro_norm, car_pass_verified, fuel_type, boost_level, boost_expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!userListings?.length) {
    return { listings: [], totals: { views: 0, messages: 0, favorites: 0, listings: 0 } };
  }

  const ids = userListings.map((l) => l.id);

  // Fetch all stats in parallel
  const [{ data: viewsData }, { data: favoritesData }, { data: convData }] = await Promise.all([
    supabase.from("car_views").select("car_listing_id").in("car_listing_id", ids),
    supabase.from("favorites").select("car_listing_id").in("car_listing_id", ids),
    supabase.from("conversations").select("car_listing_id").eq("seller_id", userId).in("car_listing_id", ids),
  ]);

  // Count stats per listing
  const countByListing = (data: { car_listing_id: string }[] | null): Record<string, number> => {
    const m: Record<string, number> = {};
    data?.forEach((d) => {
      m[d.car_listing_id] = (m[d.car_listing_id] || 0) + 1;
    });
    return m;
  };

  const viewsCounts = countByListing(viewsData);
  const favoritesCounts = countByListing(favoritesData);
  const messagesCounts = countByListing(convData);

  const listings: SellerListing[] = userListings.map((l) => ({
    id: l.id,
    brand: l.brand,
    model: l.model,
    year: l.year,
    price: l.price,
    status: (l.status || "pending") as SellerListing["status"],
    photo: l.photos?.[0] || null,
    views: viewsCounts[l.id] || 0,
    messages: messagesCounts[l.id] || 0,
    favorites: favoritesCounts[l.id] || 0,
    createdAt: l.created_at,
    euroNorm: l.euro_norm,
    carPassVerified: l.car_pass_verified ?? false,
    fuelType: l.fuel_type,
  }));

  const totals: DashboardTotals = {
    views: listings.reduce((sum, l) => sum + l.views, 0),
    messages: listings.reduce((sum, l) => sum + l.messages, 0),
    favorites: listings.reduce((sum, l) => sum + l.favorites, 0),
    listings: listings.length,
  };

  return { listings, totals };
}

/**
 * Fetches daily stats for charts
 */
async function fetchDailyStats(userId: string, days: ChartPeriod, locale: Locale): Promise<DailyStats[]> {
  const { data: userListings } = await supabase
    .from("car_listings")
    .select("id")
    .eq("user_id", userId);

  if (!userListings?.length) return [];

  const listingIds = userListings.map((l) => l.id);
  const startDate = subDays(new Date(), days);

  const [{ data: viewsData }, { data: conversationsData }, { data: favoritesData }] = await Promise.all([
    supabase.from("car_views").select("viewed_at").in("car_listing_id", listingIds).gte("viewed_at", startDate.toISOString()),
    supabase.from("conversations").select("created_at").eq("seller_id", userId).in("car_listing_id", listingIds).gte("created_at", startDate.toISOString()),
    supabase.from("favorites").select("created_at").in("car_listing_id", listingIds).gte("created_at", startDate.toISOString()),
  ]);

  const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
  const viewsByDay: Record<string, number> = {};
  const messagesByDay: Record<string, number> = {};
  const favoritesByDay: Record<string, number> = {};

  viewsData?.forEach((v) => {
    const d = format(startOfDay(new Date(v.viewed_at)), "yyyy-MM-dd");
    viewsByDay[d] = (viewsByDay[d] || 0) + 1;
  });
  conversationsData?.forEach((c) => {
    const d = format(startOfDay(new Date(c.created_at)), "yyyy-MM-dd");
    messagesByDay[d] = (messagesByDay[d] || 0) + 1;
  });
  favoritesData?.forEach((f) => {
    const d = format(startOfDay(new Date(f.created_at)), "yyyy-MM-dd");
    favoritesByDay[d] = (favoritesByDay[d] || 0) + 1;
  });

  return allDays.map((day) => {
    const k = format(day, "yyyy-MM-dd");
    return {
      date: k,
      dateLabel: format(day, "d MMM", { locale }),
      views: viewsByDay[k] || 0,
      messages: messagesByDay[k] || 0,
      favorites: favoritesByDay[k] || 0,
    };
  });
}

// Import locale type
import type { Locale } from "date-fns";

/**
 * Custom hook for seller dashboard data and actions
 */
export function useSellerListings(period: ChartPeriod = 30, dateLocale?: Locale) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Main listings query
  const listingsQuery = useQuery({
    queryKey: ["seller-listings", user?.id],
    queryFn: () => fetchSellerListings(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Daily stats query
  const statsQuery = useQuery({
    queryKey: ["seller-daily-stats", user?.id, period],
    queryFn: () => fetchDailyStats(user!.id, period, dateLocale!),
    enabled: !!user?.id && !!dateLocale,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from("car_listings")
        .delete()
        .eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      toast.success(t("dashboard.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("dashboard.deleteError"));
    },
  });

  // Mark as sold mutation
  const markAsSoldMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from("car_listings")
        .update({ status: "sold" })
        .eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      toast.success(t("dashboard.markedAsSold") || "Véhicule marqué comme vendu");
    },
    onError: () => {
      toast.error(t("dashboard.updateError") || "Erreur lors de la mise à jour");
    },
  });

  return {
    listings: listingsQuery.data?.listings ?? [],
    totals: listingsQuery.data?.totals ?? { views: 0, messages: 0, favorites: 0, listings: 0 },
    dailyStats: statsQuery.data ?? [],
    isLoading: listingsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    deleteListing: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    markAsSold: markAsSoldMutation.mutate,
    isMarkingAsSold: markAsSoldMutation.isPending,
    refetch: listingsQuery.refetch,
  };
}
