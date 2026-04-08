/**
 * Hook for admin conversation management
 * @module features/admin/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminConversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  car_brand: string | null;
  car_model: string | null;
  car_image: string | null;
  car_listing_id: string | null;
  last_message_at: string | null;
  created_at: string;
  message_count: number;
  buyer_name: string | null;
  seller_name: string | null;
  last_message: string | null;
}

async function fetchAdminConversations(): Promise<AdminConversation[]> {
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  const results = await Promise.all(
    (convos || []).map(async (c) => {
      // Fetch buyer & seller names
      const [buyerRes, sellerRes, msgCountRes, lastMsgRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('user_id', c.buyer_id).maybeSingle(),
        supabase.from('profiles').select('display_name').eq('user_id', c.seller_id).maybeSingle(),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', c.id),
        supabase.from('messages').select('content').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      return {
        id: c.id,
        buyer_id: c.buyer_id,
        seller_id: c.seller_id,
        car_brand: c.car_brand,
        car_model: c.car_model,
        car_image: c.car_image,
        car_listing_id: c.car_listing_id,
        last_message_at: c.last_message_at,
        created_at: c.created_at,
        message_count: msgCountRes.count || 0,
        buyer_name: buyerRes.data?.display_name || 'Inconnu',
        seller_name: sellerRes.data?.display_name || 'Inconnu',
        last_message: lastMsgRes.data?.content || null,
      } as AdminConversation;
    })
  );

  return results;
}

export interface AdminMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean | null;
  created_at: string;
  sender_name: string | null;
}

async function fetchConversationMessages(conversationId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, image_url, is_read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const senderIds = [...new Set((data || []).map(m => m.sender_id))];
  const profileMap = new Map<string, string>();

  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', senderIds);
    (profiles || []).forEach(p => profileMap.set(p.user_id, p.display_name || 'Inconnu'));
  }

  return (data || []).map(m => ({
    ...m,
    sender_name: profileMap.get(m.sender_id) || 'Inconnu',
  }));
}

export function useAdminConversations() {
  const qc = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['admin', 'conversations'],
    queryFn: fetchAdminConversations,
    refetchInterval: 30_000,
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      // Delete messages first, then conversation
      const { error: msgErr } = await supabase.from('messages').delete().eq('conversation_id', id);
      if (msgErr) throw msgErr;
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;

      // Log action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: 'delete_conversation',
          target_type: 'conversation',
          target_id: id,
        });
      }
    },
    onSuccess: () => {
      toast.success('Conversation supprimée');
      qc.invalidateQueries({ queryKey: ['admin', 'conversations'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const deleteMessage = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await supabase.from('messages').delete().eq('id', msgId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: 'delete_message',
          target_type: 'message',
          target_id: msgId,
        });
      }
    },
    onSuccess: () => {
      toast.success('Message supprimé');
      qc.invalidateQueries({ queryKey: ['admin', 'conversation-messages'] });
      qc.invalidateQueries({ queryKey: ['admin', 'conversations'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return {
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    deleteConversation: deleteConversation.mutate,
    deleteMessage: deleteMessage.mutate,
    isActing: deleteConversation.isPending || deleteMessage.isPending,
    fetchMessages: fetchConversationMessages,
  };
}
