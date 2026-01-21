import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChatWindow } from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface Conversation {
  id: string;
  car_listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  car_brand: string | null;
  car_model: string | null;
  car_image: string | null;
  last_message_at: string;
  created_at: string;
  unread_count?: number;
  last_message?: string;
}

export default function Messages() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setCurrentUserId(session.user.id);
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchConversations = async () => {
      // Fetch conversations
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setIsLoading(false);
        return;
      }

      // For each conversation, get unread count and last message
      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (conv) => {
          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUserId);

          // Get last message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            unread_count: count || 0,
            last_message: lastMsgData?.content || ''
          };
        })
      );

      setConversations(conversationsWithDetails);
      setIsLoading(false);
    };

    fetchConversations();

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
  }, [currentUserId]);

  const getLocale = () => {
    return language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return t("messages.yesterday");
    } else if (days < 7) {
      return date.toLocaleDateString(getLocale(), { weekday: 'short' });
    } else {
      return date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-8">{t("messages.title")}</h1>

          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">{t("messages.noMessages")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("messages.noMessagesDesc")}
              </p>
              <Button onClick={() => navigate('/')}>
                {t("messages.viewVehicles")}
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
              {/* Conversations list */}
              <div className={`lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden ${selectedConversation ? 'hidden lg:block' : ''}`}>
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">{t("messages.conversations")}</h2>
                </div>
                <div className="overflow-y-auto h-full">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-4 flex gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                        selectedConversation === conv.id ? 'bg-secondary' : ''
                      }`}
                    >
                      {/* Car image */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        {conv.car_image ? (
                          <img 
                            src={conv.car_image} 
                            alt={`${conv.car_brand} ${conv.car_model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">
                            {conv.car_brand} {conv.car_model}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDate(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.last_message || t("messages.noMessage")}
                        </p>
                        {(conv.unread_count ?? 0) > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium mt-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat window */}
              <div className={`lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden flex flex-col ${!selectedConversation ? 'hidden lg:flex' : ''}`}>
                {selectedConversation && currentUserId ? (
                  <ChatWindow 
                    conversationId={selectedConversation} 
                    currentUserId={currentUserId}
                    onBack={() => setSelectedConversation(null)}
                    showBackButton={true}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("messages.selectConversation")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}