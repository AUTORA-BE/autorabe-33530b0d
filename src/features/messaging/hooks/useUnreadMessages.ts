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

    const fetchUnreadCount = async () => {
      // Get all conversations where user is buyer or seller
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Count unread messages not sent by current user
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages-count')
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
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, hasUnread: unreadCount > 0 };
}

export default useUnreadMessages;
