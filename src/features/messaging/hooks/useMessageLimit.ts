/**
 * Hook to check daily message limit for free users
 * @module features/messaging/hooks
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFeatureAccess } from '@/features/subscription/hooks/useFeatureAccess';

const MESSAGE_LIMIT_KEY = ['daily-message-count'];

/**
 * Hook providing daily message limit checking and incrementing
 */
export function useMessageLimit() {
  const { user } = useAuth();
  const { messageLimitPerDay, isPaid } = useFeatureAccess();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: currentCount = 0, isLoading } = useQuery({
    queryKey: [...MESSAGE_LIMIT_KEY, user?.id, today],
    queryFn: async () => {
      if (!user || !messageLimitPerDay) return 0;

      const { data } = await supabase
        .from('daily_message_counts')
        .select('count')
        .eq('user_id', user.id)
        .eq('message_date', today)
        .maybeSingle();

      return data?.count ?? 0;
    },
    enabled: !!user && !!messageLimitPerDay,
    staleTime: 30_000,
  });

  const incrementMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('daily_message_counts')
        .select('id, count')
        .eq('user_id', user.id)
        .eq('message_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('daily_message_counts')
          .update({ count: existing.count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_message_counts')
          .insert({ user_id: user.id, message_date: today, count: 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGE_LIMIT_KEY });
    },
  });

  const canSendMessage = !messageLimitPerDay || currentCount < messageLimitPerDay;
  const remaining = messageLimitPerDay ? Math.max(0, messageLimitPerDay - currentCount) : null;

  return {
    canSendMessage,
    remaining,
    limit: messageLimitPerDay,
    currentCount,
    isLoading,
    isPaid,
    increment: incrementMutation.mutate,
  };
}
