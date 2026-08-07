/**
 * Unread messages count hook
 * Tracks unread message count across all conversations
 * @module features/messaging/hooks
 */

import { useState, useEffect } from 'react';
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
 * @returns Unread count and helper boolean
 * 
 * @example
 * ```tsx
 * const { unreadCount, hasUnread } = useUnreadMessages();
 * if (hasUnread) {
 *   // Show badge with unreadCount
 * }
 * ```
 */
export function useUnreadMessages(): UseUnreadMessagesResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const fetchUnreadCount = async () => {
      // Guard against duplicated concurrent calls (StrictMode / realtime bursts)
      if (inFlight) return;
      inFlight = true;
      try {
        // Server-side count via RPC (uses auth.uid()); avoids fragile PostgREST HEAD+count queries
        const { data, error } = await supabase.rpc('get_unread_message_count');
        if (cancelled) return;
        // A badge must never break navigation: fail silently to 0
        setUnreadCount(error ? 0 : (data ?? 0));
      } catch {
        if (!cancelled) setUnreadCount(0);
      } finally {
        inFlight = false;
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages — unique channel name per user + instance
    // to avoid "cannot add postgres_changes callbacks after subscribe()" when
    // the hook remounts (StrictMode, auth re-init, OAuth return in private browsing).
    const channelName = `unread-messages-count:${userId}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, hasUnread: unreadCount > 0 };
}

export default useUnreadMessages;
