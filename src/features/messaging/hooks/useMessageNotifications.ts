/**
 * Hook for in-app message notifications (toast + sound)
 * Subscribes to realtime INSERT on messages table and shows a Sonner toast
 * when the current user receives a new message outside the active chat.
 * @module features/messaging/hooks
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

const NOTIFICATION_SOUND_URL = '/notification.mp3';

/**
 * Play the notification sound once.
 */
function playNotificationSound() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Browser may block autoplay – silently ignore
    });
  } catch {
    // Audio API unavailable
  }
}

/**
 * Activate in-app notifications for incoming messages.
 * Must be called once at the top-level (e.g. Header) when the user is authenticated.
 */
export function useMessageNotifications(userId: string | undefined) {
  const location = useLocation();
  const navigate = useNavigate();
  // Keep location ref so the realtime callback always sees the latest path
  const locationRef = useRef(location.pathname);
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('global-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Ignore own messages
          if (msg.sender_id === userId) return;

          // Check if user is already on the messages page (they'll see it live)
          if (locationRef.current === '/messages') return;

          // Check that this user is part of the conversation
          const { data: convo } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', msg.conversation_id)
            .single();

          if (!convo) return;
          if (convo.buyer_id !== userId && convo.seller_id !== userId) return;

          // Get sender name
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', msg.sender_id)
            .maybeSingle();

          const senderName = profile?.display_name || 'Quelqu\'un';
          const preview = msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content;

          playNotificationSound();

          toast(senderName, {
            description: preview,
            action: {
              label: 'Voir',
              onClick: () => navigate('/messages'),
            },
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, navigate]);
}

export default useMessageNotifications;
