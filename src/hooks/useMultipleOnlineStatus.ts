import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMultipleOnlineStatus(currentUserId: string | null, otherUserIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId || otherUserIds.length === 0) return;

    // Use a global presence channel for all conversations
    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineSet = new Set<string>();
        
        // Get all online user IDs from presence state
        Object.keys(state).forEach(userId => {
          if (otherUserIds.includes(userId)) {
            onlineSet.add(userId);
          }
        });
        
        setOnlineUsers(onlineSet);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (otherUserIds.includes(key)) {
          setOnlineUsers(prev => new Set([...prev, key]));
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserIds.join(',')]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return { onlineUsers, isUserOnline };
}
