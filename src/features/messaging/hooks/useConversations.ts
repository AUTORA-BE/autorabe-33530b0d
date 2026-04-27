/**
 * Conversations list hook
 * Fetches and manages user's conversations
 * @module features/messaging/hooks
 */

import {  useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {  Conversation, ConversationRow } from '../types/messaging.types';

interface UseConversationsResult {
  /** List of conversations */
  conversations: Conversation[];
  /** Whether conversations are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh conversations */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing user's conversations
 * 
 * @param userId - Current user's ID
 * @returns Conversations list and state
 * 
 * @example
 * ```tsx
 * const { conversations, isLoading } = useConversations(user?.id);
 * ```
 */
export function useConversations(userId: string | undefined): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch conversations
      const { data: convos, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (fetchError) throw fetchError;

      // For each conversation, get unread count and last message
      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (conv: ConversationRow) => {
          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          // Get last message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
          
          return {
            id: conv.id,
            carListingId: conv.car_listing_id,
            buyerId: conv.buyer_id,
            sellerId: conv.seller_id,
            carBrand: conv.car_brand,
            carModel: conv.car_model,
            carImage: conv.car_image,
            lastMessageAt: conv.last_message_at,
            createdAt: conv.created_at,
            unreadCount: count || 0,
            lastMessage: lastMsgData?.content || '',
            otherUserId,
          } as Conversation;
        })
      );

      setConversations(conversationsWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();

    if (!userId) return;

    // Subscribe to conversation updates
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}

export default useConversations;
