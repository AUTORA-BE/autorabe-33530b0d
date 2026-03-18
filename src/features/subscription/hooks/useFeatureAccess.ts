/**
 * Hook to check feature access based on subscription tier
 * @module features/subscription/hooks
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { IS_BETA_MODE } from '@/config/betaConfig';
import {
  FREE_PARTICULIER_LIMIT,
  FREE_MESSAGE_LIMIT,
  FREE_MAX_PHOTOS,
  SUBSCRIPTION_TIERS,
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
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  return useMemo<FeatureAccess>(() => {
    // Beta mode: everyone gets Pro features for free
    if (!isLoading && IS_BETA_MODE) {
      const proTier = SUBSCRIPTION_TIERS.pro;
      return {
        maxListings: proTier.maxListings,
        messageLimitPerDay: proTier.messageLimitPerDay,
        maxPhotos: proTier.maxPhotos,
        hasDashboard: proTier.hasDashboard,
        showAds: false,
        requiresTva: false,
        badge: 'Membre Fondateur 🚀',
        isPaid: true,
        isPro: false,
        tier: proTier,
        isLoading: false,
      };
    }

    // Admins automatically get Premium access
    if (!isLoading && isAdmin) {
      const premiumTier = SUBSCRIPTION_TIERS.premium;
      return {
        maxListings: premiumTier.maxListings,
        messageLimitPerDay: premiumTier.messageLimitPerDay,
        maxPhotos: premiumTier.maxPhotos,
        hasDashboard: premiumTier.hasDashboard,
        showAds: false,
        requiresTva: false,
        badge: 'Admin Premium',
        isPaid: true,
        isPro: true,
        tier: premiumTier,
        isLoading: false,
      };
    }

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
  }, [subscribed, tier, isLoading, isAdmin]);
}
