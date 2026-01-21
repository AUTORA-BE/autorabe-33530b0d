import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUser {
  oderId: string;
  online_at: string;
}

export function useOnlineStatus(conversationId: string, currentUserId: string, otherUserId: string) {
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
