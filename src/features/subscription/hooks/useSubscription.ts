/**
 * Hook for managing Stripe subscription state
 * @module features/subscription/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '../constants/tiers';

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  productId: string | null;
  tier: SubscriptionTier | null;
  subscriptionEnd: string | null;
}

/**
 * Hook to check and manage the current user's Stripe subscription
 */
export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscribed: false,
    productId: null,
    tier: null,
    subscriptionEnd: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ isLoading: false, subscribed: false, productId: null, tier: null, subscriptionEnd: null });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      const tier = Object.values(SUBSCRIPTION_TIERS).find(
        (t) => t.product_id === data.product_id
      ) ?? null;

      setState({
        isLoading: false,
        subscribed: data.subscribed,
        productId: data.product_id,
        tier,
        subscriptionEnd: data.subscription_end,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    // Refresh every 60 seconds as a safety net
    const interval = setInterval(checkSubscription, 60_000);

    // Refetch when the tab regains focus / visibility (admin changes a sub elsewhere)
    const onVisible = () => {
      if (document.visibilityState === "visible") checkSubscription();
    };
    window.addEventListener("focus", checkSubscription);
    document.addEventListener("visibilitychange", onVisible);

    // Realtime: instant refresh when the current user's subscription row changes
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      channel = supabase
        .channel(`subscription-sync-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${uid}` },
          () => checkSubscription()
        )
        .subscribe();
    })();

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener("focus", checkSubscription);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, [checkSubscription]);

  const createCheckout = useCallback(async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  }, []);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
