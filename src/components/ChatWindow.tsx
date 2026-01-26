import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  image_url?: string;
  reply_to_id?: string | null;
}

interface ConversationDetails {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  carBrand?: string;
  carModel?: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatWindow({ 
  conversationId, 
  currentUserId, 
  onBack,
  showBackButton = false 
}: ChatWindowProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { playNotificationSound } = useNotificationSound();

  const { isOtherTyping, handleTyping, stopTyping } = useTypingIndicator(
    conversationId, 
    currentUserId
  );

  const isOnline = useOnlineStatus(
    conversationId, 
    currentUserId, 
    conversationDetails?.otherUserId || ''
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch conversation details with profile info
  useEffect(() => {
    const fetchConversationDetails = async () => {
      const { data: conv, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return;
      }

      const otherUserId = conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id;
      
      // Fetch profile for the other user
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', otherUserId)
        .maybeSingle();
      
      const defaultName = conv.buyer_id === currentUserId ? 'Vendeur' : 'Acheteur';
      
      setConversationDetails({
        otherUserId,
        otherUserName: profile?.display_name || defaultName,
        otherUserAvatar: profile?.avatar_url || undefined,
        carBrand: conv.car_brand,
        carModel: conv.car_model,
      });
    };

    fetchConversationDetails();
  }, [conversationId, currentUserId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      setIsLoading(false);

      // Mark unread messages as read
      const unreadMessages = data?.filter(m => !m.is_read && m.sender_id !== currentUserId);
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Play notification sound if we're the recipient
          if (newMessage.sender_id !== currentUserId) {
            playNotificationSound();
            
            // Mark as read
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
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => 
            prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom on new messages or when loading completes
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom('instant');
    }
  }, [isLoading, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Scroll when typing indicator appears
  useEffect(() => {
    if (isOtherTyping) {
      scrollToBottom();
    }
  }, [isOtherTyping, scrollToBottom]);

  const sendMessage = async (content: string, imageUrl?: string, replyToId?: string) => {
    if (isSending) return;
    if (!content.trim() && !imageUrl) return;

    setIsSending(true);
    stopTyping();
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content || '',
          image_url: imageUrl,
          reply_to_id: replyToId || null
        });

      if (error) throw error;
      
      // Clear reply state
      setReplyTo(null);

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Send email notification to seller (fire and forget)
      supabase.functions.invoke('notify-seller', {
        body: {
          conversationId,
          messageContent: content || (imageUrl ? '[Image]' : '')
        }
      }).catch(err => console.log('Email notification error (non-blocking):', err));

      // Send push notification to the other user (fire and forget)
      const recipientId = conversationDetails?.otherUserId;
      if (recipientId) {
        supabase.functions.invoke('send-push-notification', {
          body: {
            userId: recipientId,
            title: 'Nouveau message',
            body: content ? (content.length > 50 ? content.substring(0, 50) + '...' : content) : '📷 Image',
            tag: `chat-${conversationId}`,
            data: { url: '/messages' }
          }
        }).catch(err => console.log('Push notification error (non-blocking):', err));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t("messages.sendError"));
    } finally {
      setIsSending(false);
    }
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t("messages.today");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("messages.yesterday");
    } else {
      return date.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' });
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(message => {
    const dateStr = new Date(message.created_at).toDateString();
    const existingGroup = groupedMessages.find(g => 
      new Date(g.messages[0].created_at).toDateString() === dateStr
    );
    
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groupedMessages.push({ date: dateStr, messages: [message] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with avatar and status */}
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

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                {formatDateSeparator(group.messages[0].created_at)}
              </span>
            </div>
            
            {/* Messages */}
            <div className="space-y-2">
              {group.messages.map((message) => {
                const replyToMessage = message.reply_to_id 
                  ? messages.find(m => m.id === message.reply_to_id) 
                  : null;
                const replyToSenderName = replyToMessage
                  ? replyToMessage.sender_id === currentUserId 
                    ? 'Vous' 
                    : conversationDetails?.otherUserName || 'Message'
                  : undefined;
                  
                return (
                  <MessageBubble
                    key={message.id}
                    content={message.content}
                    timestamp={message.created_at}
                    isMine={message.sender_id === currentUserId}
                    isRead={message.is_read}
                    imageUrl={message.image_url}
                    replyTo={replyToMessage}
                    replyToSenderName={replyToSenderName}
                    onReply={() => setReplyTo(message)}
                  />
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isOtherTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput
        onSend={sendMessage}
        onTyping={handleTyping}
        disabled={isSending}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
