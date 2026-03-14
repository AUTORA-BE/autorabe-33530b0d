/**
 * Hook to check feature access based on subscription tier
 * @module features/subscription/hooks
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import {
  FREE_PARTICULIER_LIMIT,
  FREE_MESSAGE_LIMIT,
  FREE_MAX_PHOTOS,
  type SubscriptionTier,
} from '../constants/tiers';

export interface FeatureAccess {
  /** Max simultaneous listings (null = unlimited) */
  maxListings: number | null;
  /** Daily message limit (null = unlimited) */
  messageLimitPerDay: number | null;
  /** Max photos per listing */
  maxPhotos: number;
  /** Whether the user has dashboard access */
  hasDashboard: boolean;
  /** Whether ads are shown */
  showAds: boolean;
  /** Whether TVA is required */
  requiresTva: boolean;
  /** Active badge label or null */
  badge: string | null;
  /** Whether user has any paid subscription */
  isPaid: boolean;
  /** Whether user is on a professional plan */
  isPro: boolean;
  /** Current tier or null for free */
  tier: SubscriptionTier | null;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Provides computed feature access flags based on the user's subscription
 */
export function useFeatureAccess(): FeatureAccess {
  const { subscribed, tier, isLoading } = useSubscription();

  return useMemo<FeatureAccess>(() => {
    if (isLoading) {
      return {
        maxListings: FREE_PARTICULIER_LIMIT,
        messageLimitPerDay: FREE_MESSAGE_LIMIT,
        maxPhotos: FREE_MAX_PHOTOS,
        hasDashboard: false,
        showAds: true,
        requiresTva: false,
        badge: null,
        isPaid: false,
        isPro: false,
        tier: null,
        isLoading: true,
      };
    }

    if (!subscribed || !tier) {
      return {
        maxListings: FREE_PARTICULIER_LIMIT,
        messageLimitPerDay: FREE_MESSAGE_LIMIT,
        maxPhotos: FREE_MAX_PHOTOS,
        hasDashboard: false,
        showAds: true,
        requiresTva: false,
        badge: null,
        isPaid: false,
        isPro: false,
        tier: null,
        isLoading: false,
      };
    }

    return {
      maxListings: tier.maxListings,
      messageLimitPerDay: tier.messageLimitPerDay,
      maxPhotos: tier.maxPhotos,
      hasDashboard: tier.hasDashboard,
      showAds: tier.showAds,
      requiresTva: tier.requiresTva,
      badge: tier.badge,
      isPaid: true,
      isPro: tier.category === 'professionnel',
      tier,
      isLoading: false,
    };
  }, [subscribed, tier, isLoading]);
}
