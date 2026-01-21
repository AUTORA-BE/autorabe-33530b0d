import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingState {
  userId: string;
  isTyping: boolean;
}

export function useTypingIndicator(conversationId: string, currentUserId: string) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  // Broadcast typing status
  const broadcastTyping = useCallback((isTyping: boolean) => {
    const now = Date.now();
    // Throttle: only broadcast every 2 seconds when typing
    if (isTyping && now - lastBroadcastRef.current < 2000) return;
    lastBroadcastRef.current = now;

    const channel = supabase.channel(`typing-${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping }
    });
  }, [conversationId, currentUserId]);

  // Handle input change - call this when user types
  const handleTyping = useCallback(() => {
    broadcastTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 3000);
  }, [broadcastTyping]);

  // Stop typing - call this when message is sent
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    broadcastTyping(false);
  }, [broadcastTyping]);

  useEffect(() => {
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload.payload as TypingState;
        if (userId !== currentUserId) {
          setIsOtherTyping(isTyping);
        }
      })
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  return { isOtherTyping, handleTyping, stopTyping };
}
