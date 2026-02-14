import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Car } from 'lucide-react';
import { Header, Footer } from '@/shared/components';
import { ChatWindow } from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultipleOnlineStatus } from '@/hooks/useMultipleOnlineStatus';
import { useConversations } from '@/features/messaging';
import { useAuth } from '@/features/auth';

export default function Messages() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const currentUserId = user?.id || null;
  
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Use the modular useConversations hook
  const { conversations, isLoading: conversationsLoading } = useConversations(currentUserId ?? undefined);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Get all other user IDs for online status tracking
  const otherUserIds = useMemo(() => {
    return conversations
      .map(conv => conv.otherUserId)
      .filter((id): id is string => !!id);
  }, [conversations]);

  const { isUserOnline } = useMultipleOnlineStatus(currentUserId, otherUserIds);

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

  const isLoading = authLoading || conversationsLoading;

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

  // On mobile, when a conversation is selected, render full-screen chat
  const isMobileChatView = selectedConversation && currentUserId && (isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024));
  if (isMobileChatView) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col">
        <ChatWindow 
          conversationId={selectedConversation} 
          currentUserId={currentUserId}
          onBack={() => setSelectedConversation(null)}
          showBackButton={true}
        />
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
              <div className="lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">{t("messages.conversations")}</h2>
                </div>
                <div className="overflow-y-auto h-full">
                  {conversations.map((conv) => {
                    const isOnline = conv.otherUserId ? isUserOnline(conv.otherUserId) : false;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-4 flex gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                          selectedConversation === conv.id ? 'bg-secondary' : ''
                        }`}
                      >
                        {/* Car image with online indicator */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {conv.carImage ? (
                            <img 
                              src={conv.carImage} 
                              alt={`${conv.carBrand} ${conv.carModel}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {/* Online indicator */}
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-card" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground truncate">
                              {conv.carBrand} {conv.carModel}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conv.lastMessage || t("messages.noMessage")}
                          </p>
                          {(conv.unreadCount ?? 0) > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium mt-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat window - desktop only */}
              <div className={`lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden flex flex-col min-h-0 hidden lg:flex`}>
                {selectedConversation && currentUserId ? (
                  <ChatWindow 
                    conversationId={selectedConversation} 
                    currentUserId={currentUserId}
                    onBack={() => setSelectedConversation(null)}
                    showBackButton={false}
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