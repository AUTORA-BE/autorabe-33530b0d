/**
 * Online status hook for single user in conversation
 * Uses Supabase presence for real-time status
 * @module features/messaging/hooks
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for tracking if another user is online in a conversation
 * 
 * @param conversationId - ID of the conversation
 * @param currentUserId - Current user's ID  
 * @param otherUserId - Other user's ID to track
 * @returns Whether the other user is online
 * 
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus(conversationId, myId, otherUserId);
 * ```
 */
export function useOnlineStatus(
  conversationId: string,
  currentUserId: string,
  otherUserId: string
): boolean {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!otherUserId) return;

    const channel = supabase.channel(`presence-${conversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if other user is in the presence state
        const isOtherOnline = Object.keys(state).includes(otherUserId);
        setIsOnline(isOtherOnline);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === otherUserId) {
          setIsOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUserId) {
          setIsOnline(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            oderId: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, otherUserId]);

  return isOnline;
}

export default useOnlineStatus;
