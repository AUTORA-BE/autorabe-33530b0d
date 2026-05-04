/**
 * Hook to check if user has reached their listing limit
 * Admins have unlimited listings.
 * @module features/subscription/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { FREE_PARTICULIER_LIMIT, SUBSCRIPTION_TIERS } from '../constants/tiers';
import { IS_BETA_MODE } from '@/config/betaConfig';

interface ListingLimitState {
  isLoading: boolean;
  activeCount: number;
  maxAllowed: number | null;
  canPublish: boolean;
  sellerType: string | null;
}

/**
 * Checks the user's active listing count against their plan limit.
 * Admin users always get unlimited publishing rights.
 */
export function useListingLimit() {
  const { subscribed, tier, isLoading: subLoading } = useSubscription();
  const [state, setState] = useState<ListingLimitState>({
    isLoading: true,
    activeCount: 0,
    maxAllowed: FREE_PARTICULIER_LIMIT,
    canPublish: true,
    sellerType: null,
  });

  const checkLimit = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ isLoading: false, activeCount: 0, maxAllowed: FREE_PARTICULIER_LIMIT, canPublish: true, sellerType: null });
        return;
      }

      // Check if user is admin — admins get unlimited listings
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin' as any,
      });

      if (isAdmin) {
        // Count for display purposes only
        const { count } = await supabase
          .from('car_listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved']);

        setState({
          isLoading: false,
          activeCount: count ?? 0,
          maxAllowed: null, // unlimited
          canPublish: true,
          sellerType: 'admin',
        });
        return;
      }

      // Count active listings (pending + approved)
      const { count, error } = await supabase
        .from('car_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved']);

      if (error) throw error;

      const activeCount = count ?? 0;

      // Determine max allowed based on subscription
      let maxAllowed: number | null;
      if (IS_BETA_MODE) {
        // Beta mode: everyone gets Pro limits for free
        maxAllowed = SUBSCRIPTION_TIERS.pro.maxListings;
      } else if (subscribed && tier) {
        maxAllowed = tier.maxListings; // null = unlimited
      } else {
        // Free tier: 3 simultaneous for particulier
        maxAllowed = FREE_PARTICULIER_LIMIT;
      }

      const canPublish = maxAllowed === null || activeCount < maxAllowed;

      setState({
        isLoading: false,
        activeCount,
        maxAllowed,
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
