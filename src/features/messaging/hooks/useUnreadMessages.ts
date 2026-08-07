/**
 * Unread messages count hook
 * Shared across Header + BottomNav (both mounted simultaneously) via TanStack Query:
 * same key = one single network request, no duplication.
 * @module features/messaging/hooks
 */

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadMessagesResult {
  /** Total unread message count */
  unreadCount: number;
  /** Whether there are any unread messages */
  hasUnread: boolean;
}

/**
 * Hook for tracking total unread messages across all conversations
 *
 * @example
 * ```tsx
 * const { unreadCount, hasUnread } = useUnreadMessages();
 * ```
 */
export function useUnreadMessages(): UseUnreadMessagesResult {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data } = useQuery({
    queryKey: ['unread-message-count', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Server-side count via RPC (uses auth.uid())
      const { data, error } = await supabase.rpc('get_unread_message_count');
      // A badge must never break navigation: fail silently to 0
      if (error) return 0;
      return (data as number | null) ?? 0;
    },
  });

  // Realtime: invalidate the shared key instead of firing a manual fetch per consumer
  useEffect(() => {
    if (!userId) return;

    const channelName = `unread-messages-count:${userId}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-message-count', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const unreadCount = data ?? 0;
  return { unreadCount, hasUnread: unreadCount > 0 };
}

export default useUnreadMessages;
