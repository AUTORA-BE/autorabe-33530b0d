import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MessageCircle, Car, Archive, Trash2 } from "lucide-react";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Header, Footer, BackButton } from "@/shared/components";
import { ChatWindow } from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMultipleOnlineStatus } from "@/hooks/useMultipleOnlineStatus";
import { useConversations } from "@/features/messaging";
import { useAuth } from "@/features/auth";
import { Skeleton } from "@/components/ui/skeleton";

/** Swipeable conversation row */
function SwipeableConversation({
  conv,
  isSelected,
  isOnline,
  formatDate,
  onClick,
  t,
}: {
  conv: any;
  isSelected: boolean;
  isOnline: boolean;
  formatDate: (d: string) => string;
  onClick: () => void;
  t: (k: string) => string;
}) {
  const x = useMotionValue(0);
  const archiveBg = useTransform(x, [-150, -60, 0], [1, 0.5, 0]);
  const hasUnread = (conv.unreadCount ?? 0) > 0;

  return (
    <motion.div
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200 }}
      layout
    >
      {/* Swipe background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 bg-amber-500/10"
        style={{ opacity: archiveBg }}
      >
        <Archive className="w-5 h-5 text-amber-500" />
      </motion.div>

      <motion.button
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className={`relative z-10 w-full px-4 py-3.5 flex gap-3 items-center transition-colors border-b border-border/20 ${
          isSelected
            ? "bg-primary/[0.06]"
            : hasUnread
              ? "bg-primary/[0.03]"
              : "bg-card/50 backdrop-blur-sm active:bg-secondary/50"
        }`}
      >
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary/50 flex-shrink-0 border border-border/30">
          {conv.carImage ? (
            <img
              src={conv.carImage}
              alt={`${conv.carBrand} ${conv.carModel}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
          {isOnline && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-card shadow-lg shadow-primary/30"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}
            >
              {conv.carBrand} {conv.carModel}
            </span>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatDate(conv.lastMessageAt ?? conv.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p
              className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {conv.lastMessage || t("messages.noMessage")}
            </p>
            {hasUnread && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"
              >
                {conv.unreadCount}
              </motion.span>
            )}
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const currentUserId = user?.id || null;
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { conversations, isLoading: conversationsLoading, refetch } = useConversations(
    currentUserId ?? undefined
  );

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const otherUserIds = useMemo(
    () => conversations.map((c) => c.otherUserId).filter((id): id is string => !!id),
    [conversations]
  );
  const { isUserOnline } = useMultipleOnlineStatus(currentUserId, otherUserIds);

  const getLocale = () =>
    language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)
      return date.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return t("messages.yesterday");
    if (days < 7) return date.toLocaleDateString(getLocale(), { weekday: "short" });
    return date.toLocaleDateString(getLocale(), { day: "numeric", month: "short" });
  };

  const isLoading = authLoading || conversationsLoading;

  if (isLoading) {
    return (
      <div className="page-gradient min-h-screen">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-4 rounded-[20px] bg-card/40 backdrop-blur-sm"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </motion.div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Mobile full-screen chat
  const isMobileChatView =
    selectedConversation &&
    currentUserId &&
    (isMobile || (typeof window !== "undefined" && window.innerWidth < 1024));
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
    <PullToRefresh onRefresh={refetch}>
      <div className="page-gradient min-h-screen">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <BackButton to="/" className="mb-2" />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-5 mt-2"
            >
              <h1 className="text-2xl font-bold text-foreground">{t("messages.title")}</h1>
              {conversations.length > 0 && (
                <span className="text-xs text-muted-foreground bg-card/60 backdrop-blur-sm px-3 py-1 rounded-full border border-border/30">
                  {conversations.length}{" "}
                  {conversations.length === 1 ? "conversation" : "conversations"}
                </span>
              )}
            </motion.div>

            {conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="text-center py-24"
              >
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-[20px] bg-primary/5 animate-pulse" />
                  <div className="absolute inset-2 rounded-[16px] bg-card/80 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-primary/40" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">
                  {t("messages.noMessages")}
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  {t("messages.noMessagesDesc")}
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="rounded-full px-6 shadow-lg shadow-primary/20 active:scale-[0.97] transition-transform"
                >
                  {t("messages.viewVehicles")}
                </Button>
              </motion.div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                {/* Conversations list */}
                <div className="lg:col-span-1 rounded-[20px] bg-card/40 backdrop-blur-xl border border-border/30 overflow-hidden flex flex-col shadow-lg shadow-foreground/[0.03]">
                  <div className="overflow-y-auto flex-1">
                    <AnimatePresence>
                      {conversations.map((conv, i) => (
                        <SwipeableConversation
                          key={conv.id}
                          conv={conv}
                          isSelected={selectedConversation === conv.id}
                          isOnline={conv.otherUserId ? isUserOnline(conv.otherUserId) : false}
                          formatDate={formatDate}
                          onClick={() => setSelectedConversation(conv.id)}
                          t={t}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Chat window - desktop */}
                <div className="lg:col-span-2 rounded-[20px] bg-card/40 backdrop-blur-xl border border-border/30 overflow-hidden flex-col min-h-0 hidden lg:flex shadow-lg shadow-foreground/[0.03]">
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
                        <div className="w-16 h-16 rounded-[20px] bg-muted/30 flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="h-8 w-8 opacity-30" />
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
    </PullToRefresh>
  );
}
