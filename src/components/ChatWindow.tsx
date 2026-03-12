/**
 * ChatWindow component for displaying and managing chat messages
 * @module components/ChatWindow
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatHeader } from './chat/ChatHeader';
import { MessageBubble } from './chat/MessageBubble';
import { MessageInput } from './chat/MessageInput';
import { TypingIndicator } from './chat/TypingIndicator';
import { useTypingIndicator } from '@/features/messaging';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { Message, MessageRow, ConversationDetails } from '@/features/messaging/types/messaging.types';

interface ReplyToMessage {
  id: string;
  content: string;
  sender_id: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

/**
 * Full-featured chat window with real-time messaging
 */
export function ChatWindow({
  conversationId,
  currentUserId,
  onBack,
  showBackButton = false,
}: ChatWindowProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);

  // Typing indicator hook
  const { isOtherTyping, handleTyping: sendTypingIndicator, stopTyping } = useTypingIndicator(
    conversationId,
    currentUserId
  );

  // Online status - we'll track this via presence when details are loaded
  const [isOnline, setIsOnline] = useState(false);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Map database row to Message
  const mapRow = (row: MessageRow): Message => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    imageUrl: row.image_url,
    replyToId: row.reply_to_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  });

  // Fetch conversation details
  useEffect(() => {
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !data) return;

      const otherUserId = data.buyer_id === currentUserId ? data.seller_id : data.buyer_id;

      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', otherUserId)
        .single();

      setConversationDetails({
        otherUserId,
        otherUserName: profile?.display_name || 'Utilisateur',
        otherUserAvatar: profile?.avatar_url || undefined,
        carBrand: data.car_brand || undefined,
        carModel: data.car_model || undefined,
      });
    };

    fetchDetails();
  }, [conversationId, currentUserId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
        return;
      }

      setMessages((data || []).map(row => mapRow(row as MessageRow)));
      setIsLoading(false);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);
    };

    fetchMessages();
  }, [conversationId, currentUserId]);

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = mapRow(payload.new as MessageRow);
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if from other user
          if (newMessage.senderId !== currentUserId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = mapRow(payload.new as MessageRow);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updated.id ? updated : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message handler
  const handleSend = async (content: string, imageUrl?: string, replyToId?: string) => {
    if (!content.trim() && !imageUrl) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      image_url: imageUrl || null,
      reply_to_id: replyToId || null,
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error(t('messages.sendError') || "Erreur lors de l'envoi");
      return;
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Trigger push notification for the recipient
    if (conversationDetails?.otherUserId) {
      const senderName = conversationDetails?.otherUserName === 'Utilisateur'
        ? 'Quelqu\'un'
        : undefined; // We need the current user's name, fetch from profile or fallback
      
      supabase.functions.invoke('send-push-notification', {
        body: {
          userId: conversationDetails.otherUserId,
          title: 'Nouveau message',
          body: content.trim().length > 100 ? content.trim().slice(0, 100) + '…' : content.trim(),
        },
      }).catch(() => {
        // Push notification failure is non-blocking
      });
    }
  };

  // Handle typing
  const handleTyping = () => {
    sendTypingIndicator();
  };

  // Handle reply
  const handleReply = (message: Message) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      sender_id: message.senderId,
    });
  };

  // Get reply-to message
  const getReplyToMessage = (replyToId: string | null | undefined) => {
    if (!replyToId) return null;
    const msg = messages.find((m) => m.id === replyToId);
    if (!msg) return null;
    return {
      id: msg.id,
      content: msg.content,
      sender_id: msg.senderId,
    };
  };

  // Get sender name for reply
  const getReplyToSenderName = (senderId: string) => {
    if (senderId === currentUserId) return 'Vous';
    return conversationDetails?.otherUserName || 'Utilisateur';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <ChatHeader
        otherUserName={conversationDetails?.otherUserName || 'Utilisateur'}
        otherUserAvatar={conversationDetails?.otherUserAvatar}
        isOnline={isOnline}
        isTyping={isOtherTyping}
        carBrand={conversationDetails?.carBrand}
        carModel={conversationDetails?.carModel}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-center py-8">
            <p>{t('messages.startConversation') || "Envoyez un message pour démarrer la conversation"}</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              timestamp={message.createdAt}
              isMine={message.senderId === currentUserId}
              isRead={message.isRead}
              imageUrl={message.imageUrl || undefined}
              replyTo={getReplyToMessage(message.replyToId)}
              replyToSenderName={
                message.replyToId
                  ? getReplyToSenderName(getReplyToMessage(message.replyToId)?.sender_id || '')
                  : undefined
              }
              onReply={() => handleReply(message)}
            />
          ))
        )}
        
        {/* Typing indicator */}
        {isOtherTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}

export default ChatWindow;
