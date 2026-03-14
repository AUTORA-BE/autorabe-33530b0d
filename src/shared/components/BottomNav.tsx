/**
 * Instagram-style bottom navigation bar for mobile
 * @module shared/components
 */

import { memo, useMemo, useEffect, useState, useCallback } from "react";
import { Home, PlusCircle, Heart, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnreadMessages } from "@/features/messaging";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { prefetchRoute } from "@/utils/prefetchRoutes";

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { favoritesCount } = useFavorites();
  const { t } = useLanguage();
  const [user, setUser] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(!!data.session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(!!session?.user)
    );
    return () => subscription.unsubscribe();
  }, []);

  const tabs = useMemo(() => [
    { to: "/", icon: Home, label: t("nav.buy"), badge: 0 },
    { to: "/favorites", icon: Heart, label: t("nav.favorites"), badge: favoritesCount },
    { to: "/sell", icon: PlusCircle, label: t("nav.sell") || "Vendre", badge: 0, isCta: true },
    { to: user ? "/messages" : "/auth", icon: MessageCircle, label: t("nav.messages"), badge: hasUnread ? unreadCount : 0 },
    { to: user ? "/settings" : "/auth", icon: User, label: t("nav.profile") || "Profil", badge: 0 },
  ], [t, favoritesCount, hasUnread, unreadCount, user]);

  // Hide on messaging conversation (fullscreen) and auth page
  const hiddenRoutes = ["/messages", "/auth"];
  const isHidden = hiddenRoutes.some(r => location.pathname.startsWith(r));
  if (isHidden) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const isActive = tab.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.to);

          return (
            <Link
              key={tab.to + tab.label}
              to={tab.to}
              onTouchStart={() => prefetchRoute(tab.to)}
              onMouseEnter={() => prefetchRoute(tab.to)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                tab.isCta ? "" : isActive ? "text-primary" : "text-muted-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.isCta ? (
                <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 -mt-3">
                  <tab.icon className="w-6 h-6" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <tab.icon className={`w-5 h-5 transition-all ${isActive ? "scale-110" : ""}`} />
                    {tab.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 shadow-sm">
                        {tab.badge > 9 ? "9+" : tab.badge}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="w-1 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
              <span className={`text-[10px] font-medium ${tab.isCta ? "text-primary mt-0.5" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNav;
