import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Car, Search } from 'lucide-react';
import { Header, Footer } from '@/shared/components';
import { ChatWindow } from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultipleOnlineStatus } from '@/hooks/useMultipleOnlineStatus';
import { useConversations } from '@/features/messaging';
import { useAuth } from '@/features/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Messages() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const currentUserId = user?.id || null;
  
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { conversations, isLoading: conversationsLoading } = useConversations(currentUserId ?? undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

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
        <main className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-4xl space-y-3 mt-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Mobile full-screen chat
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
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Compact header */}
          <div className="flex items-center justify-between mb-4 mt-2">
            <h1 className="text-2xl font-bold text-foreground">{t("messages.title")}</h1>
            {conversations.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{t("messages.noMessages")}</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                {t("messages.noMessagesDesc")}
              </p>
              <Button onClick={() => navigate('/')} size="sm">
                {t("messages.viewVehicles")}
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
              {/* Conversations list */}
              <div className="lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                  {conversations.map((conv) => {
                    const isOnline = conv.otherUserId ? isUserOnline(conv.otherUserId) : false;
                    const hasUnread = (conv.unreadCount ?? 0) > 0;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full px-4 py-3 flex gap-3 items-center transition-colors border-b border-border/30 active:bg-secondary/70 ${
                          selectedConversation === conv.id 
                            ? 'bg-secondary' 
                            : hasUnread 
                              ? 'bg-primary/[0.03]' 
                              : 'hover:bg-secondary/50'
                        }`}
                      >
                        {/* Car thumbnail with online dot */}
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                          {conv.carImage ? (
                            <img 
                              src={conv.carImage} 
                              alt={`${conv.carBrand} ${conv.carModel}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-card" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                              {conv.carBrand} {conv.carModel}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex-shrink-0">
                              {formatDate(conv.lastMessageAt ?? conv.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={`text-xs truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {conv.lastMessage || t("messages.noMessage")}
                            </p>
                            {hasUnread && (
                              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat window - desktop */}
              <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden flex-col min-h-0 hidden lg:flex">
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
                      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="h-7 w-7 opacity-40" />
                      </div>
                      <p className="text-sm">{t("messages.selectConversation")}</p>
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
