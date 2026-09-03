/**
 * Hook to check if user has reached their listing limits
 * (simultaneous active listings + rolling 30-day creation limit).
 * Admins have unlimited listings.
 * @module features/subscription/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import {
  FREE_PARTICULIER_LIMIT,
  FREE_LISTINGS_PER_MONTH,
  SUBSCRIPTION_TIERS,
} from '../constants/tiers';
import { IS_BETA_MODE } from '@/config/betaConfig';

interface ListingLimitState {
  isLoading: boolean;
  /** Active listings (pending + approved) */
  activeCount: number;
  /** Listings created over the last 30 days (all statuses) */
  monthCount: number;
  /** Max simultaneous active listings (null = unlimited) */
  maxAllowed: number | null;
  /** Max listings creatable per rolling 30 days (null = unlimited) */
  maxPerMonth: number | null;
  canPublish: boolean;
  sellerType: string | null;
}

function thirtyDaysAgoISO() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Checks the user's listing counts against their plan limits.
 * Admin users always get unlimited publishing rights.
 */
export function useListingLimit() {
  const { subscribed, tier, isLoading: subLoading } = useSubscription();
  const [state, setState] = useState<ListingLimitState>({
    isLoading: true,
    activeCount: 0,
    monthCount: 0,
    maxAllowed: FREE_PARTICULIER_LIMIT,
    maxPerMonth: FREE_LISTINGS_PER_MONTH,
    canPublish: true,
    sellerType: null,
  });

  const checkLimit = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({
          isLoading: false,
          activeCount: 0,
          monthCount: 0,
          maxAllowed: FREE_PARTICULIER_LIMIT,
          maxPerMonth: FREE_LISTINGS_PER_MONTH,
          canPublish: true,
          sellerType: null,
        });
        return;
      }

      // Check if user is admin — admins get unlimited listings
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin' as any,
      });

      // Count active listings (pending + approved)
      const { count, error } = await supabase
        .from('car_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved']);

      if (error) throw error;

      // Count listings created over the last 30 days (all statuses)
      const { count: created } = await supabase
        .from('car_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgoISO())
        // Une annonce rejetée par un admin ne consomme pas le quota mensuel.
        .neq('status', 'rejected');

      const activeCount = count ?? 0;
      const monthCount = created ?? 0;

      if (isAdmin) {
        setState({
          isLoading: false,
          activeCount,
          monthCount,
          maxAllowed: null,
          maxPerMonth: null,
          canPublish: true,
          sellerType: 'admin',
        });
        return;
      }

      // Determine limits based on subscription
      let maxAllowed: number | null;
      let maxPerMonth: number | null;
      if (IS_BETA_MODE) {
        maxAllowed = SUBSCRIPTION_TIERS.pro.maxListings;
        maxPerMonth = SUBSCRIPTION_TIERS.pro.maxListingsPerMonth;
      } else if (subscribed && tier) {
        maxAllowed = tier.maxListings;
        maxPerMonth = tier.maxListingsPerMonth;
      } else {
        maxAllowed = FREE_PARTICULIER_LIMIT;
        maxPerMonth = FREE_LISTINGS_PER_MONTH;
      }

      const canPublish =
        (maxAllowed === null || activeCount < maxAllowed) &&
        (maxPerMonth === null || monthCount < maxPerMonth);

      setState({
        isLoading: false,
        activeCount,
        monthCount,
        maxAllowed,
        maxPerMonth,
        canPublish,
        sellerType: tier?.category ?? 'particulier',
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [subscribed, tier]);

  useEffect(() => {
    if (!subLoading) {
      checkLimit();
    }
  }, [subLoading, checkLimit]);

  return { ...state, refreshLimit: checkLimit };
}
