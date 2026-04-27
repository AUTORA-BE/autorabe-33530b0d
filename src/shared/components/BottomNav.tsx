/**
 * Premium bottom navigation bar for mobile
 * @module shared/components
 */

import { memo, useMemo, useEffect, useState } from "react";
import { Home, PlusCircle, Heart, User, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUnreadMessages } from "@/features/messaging";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";


const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { favoritesCount } = useFavorites();
  const { t } = useLanguage();
  const [user, setUser] = useState<boolean>(false);
  const { selectionChanged } = useHapticFeedback();
  // const _localized = useLocalizedHref();

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
  const hiddenRoutes = ["/messages", "/auth", "/admin"];
  const isHidden = hiddenRoutes.some(r => location.pathname.startsWith(r));
  if (isHidden) return null;

  return (
    <nav
      data-hide-on-filter
      className="md:hidden fixed bottom-0 left-0 right-0 z-[70] safe-bottom"
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Glass background with top glow line */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-2xl border-t border-border/20" />
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

      <div className="relative flex items-center justify-around h-[68px] px-2">
        {tabs.map((tab) => {
          const isActive = tab.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.to);

          if (tab.isCta) {
            return (
              <Link
                key={tab.to + tab.label}
                to={tab.to}
                onTouchStart={() => { prefetchRoute(tab.to); selectionChanged(); }}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
                aria-label={tab.label}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-5"
                >
                  {/* Outer glow ring */}
                  <div className="absolute -inset-1.5 rounded-full bg-primary/15 blur-md" />
                  <div className="relative w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30">
                    <tab.icon className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                </motion.div>
                <span className="text-[10px] font-semibold text-primary mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.to + tab.label}
              to={tab.to}
              onTouchStart={() => { prefetchRoute(tab.to); selectionChanged(); }}
              onMouseEnter={() => prefetchRoute(tab.to)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full group"
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative flex flex-col items-center"
              >
                <div className="relative">
                  <tab.icon
                    className={`w-[22px] h-[22px] transition-all duration-300 ${
                      isActive
                        ? "text-primary scale-110"
                        : "text-muted-foreground group-active:text-foreground"
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />

                  {/* Badge */}
                  <AnimatePresence>
                    {tab.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 shadow-lg shadow-primary/30"
                      >
                        {tab.badge > 9 ? "9+" : tab.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-0.5 transition-colors duration-300 ${
                    isActive
                      ? "font-semibold text-primary"
                      : "font-medium text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="w-1 h-1 rounded-full bg-primary shadow-sm shadow-primary/50 mt-0.5"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNav;
