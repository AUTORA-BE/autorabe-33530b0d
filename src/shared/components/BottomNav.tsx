/**
 * Premium bottom navigation bar for mobile — pastille détachée avec
 * bouton « Vendre » surélevé au centre.
 * @module shared/components
 */

import { memo, useMemo, useEffect, useState } from "react";
import { Home, PlusCircle, Search, User, MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUnreadMessages } from "@/features/messaging";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useLocalizedHref } from "@/lib/useLocalizedHref";
import {
  countActiveFiltersFromSearch,
  OPEN_MOBILE_SEARCH_EVENT,
} from "@/features/listings/utils/activeFilters";

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { t } = useLanguage();
  const [user, setUser] = useState<boolean>(false);
  const { selectionChanged } = useHapticFeedback();
  const localized = useLocalizedHref();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(!!data.session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(!!session?.user)
    );
    return () => subscription.unsubscribe();
  }, []);

  const searchHref = localized("/search");
  const onSearchPage =
    location.pathname === searchHref || location.pathname === "/recherche";
  const activeFilterCount = onSearchPage
    ? countActiveFiltersFromSearch(location.search)
    : 0;

  const openSearch = () => {
    selectionChanged();
    if (onSearchPage) {
      window.dispatchEvent(new CustomEvent(OPEN_MOBILE_SEARCH_EVENT));
    } else {
      navigate(searchHref);
    }
  };

  const sideTabs = useMemo(() => [
    { to: "/", icon: Home, label: t("nav.buy") || "Accueil", badge: 0 },
    { to: user ? "/messages" : "/auth", icon: MessageCircle, label: t("nav.messages"), badge: hasUnread ? unreadCount : 0 },
    { to: user ? "/settings" : "/auth", icon: User, label: t("nav.profile") || "Profil", badge: 0 },
  ], [t, hasUnread, unreadCount, user]);

  // Hide on messaging conversation (fullscreen), auth and admin pages
  const hiddenRoutes = ["/messages", "/auth", "/admin"];
  const isHidden = hiddenRoutes.some(r => location.pathname.startsWith(r));
  if (isHidden) return null;

  const itemCls =
    "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full group";

  const renderIcon = (
    Icon: typeof Home,
    label: string,
    badge: number,
    isActive: boolean,
  ) => (
    <motion.div whileTap={{ scale: 0.85 }} className="relative flex flex-col items-center">
      <div className="relative">
        <Icon
          className={`w-[22px] h-[22px] transition-all duration-300 ${
            isActive ? "text-primary scale-110" : "text-muted-foreground group-active:text-foreground"
          }`}
          strokeWidth={isActive ? 2.4 : 1.8}
        />
        <AnimatePresence>
          {badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 shadow-lg shadow-primary/30"
            >
              {badge > 9 ? "9+" : badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span
        className={`text-[10px] mt-0.5 transition-colors duration-300 ${
          isActive ? "font-semibold text-primary" : "font-medium text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </motion.div>
  );

  const homeTab = sideTabs[0];
  const rightTabs = sideTabs.slice(1);
  const sellTo = user ? "/sell" : "/auth?returnTo=/sell";

  return (
    <nav
      data-hide-on-filter
      className="md:hidden fixed inset-x-0 bottom-0 z-[70] pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="pointer-events-auto relative mx-3 h-[64px] rounded-[26px] border border-border/30 bg-card/85 backdrop-blur-2xl shadow-[0_18px_45px_-12px_rgba(0,0,0,0.45)]">
        {/* Raised CTA — Vendre */}
        <Link
          to={sellTo}
          onTouchStart={() => { prefetchRoute(sellTo); selectionChanged(); }}
          aria-label={t("nav.sell") || "Vendre"}
          className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center"
        >
          <motion.div whileTap={{ scale: 0.9 }} className="relative">
            <div className="absolute -inset-1.5 rounded-full bg-primary/20 blur-md" />
            <div className="relative w-[56px] h-[56px] rounded-full bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40 ring-4 ring-background/70">
              <PlusCircle className="w-6 h-6" strokeWidth={2.2} />
            </div>
          </motion.div>
          <span className="text-[10px] font-semibold text-primary mt-0.5">
            {t("nav.sell") || "Vendre"}
          </span>
        </Link>

        <div className="flex items-center h-full px-1">
          {/* Left group */}
          <Link
            to={homeTab.to}
            onTouchStart={() => { prefetchRoute(homeTab.to); selectionChanged(); }}
            onMouseEnter={() => prefetchRoute(homeTab.to)}
            className={itemCls}
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            {renderIcon(homeTab.icon, homeTab.label, 0, location.pathname === "/")}
          </Link>

          <button
            type="button"
            onClick={openSearch}
            className={itemCls}
            aria-label={
              onSearchPage
                ? `Ouvrir la recherche et les filtres${activeFilterCount > 0 ? ` (${activeFilterCount} actifs)` : ""}`
                : "Rechercher un véhicule"
            }
            aria-current={onSearchPage ? "page" : undefined}
          >
            {renderIcon(Search, t("nav.search") || "Rechercher", activeFilterCount, onSearchPage)}
          </button>

          {/* Spacer for the raised CTA */}
          <span aria-hidden className="w-[64px] shrink-0" />

          {/* Right group */}
          {rightTabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to + tab.label}
                to={tab.to}
                onTouchStart={() => { prefetchRoute(tab.to); selectionChanged(); }}
                onMouseEnter={() => prefetchRoute(tab.to)}
                className={itemCls}
                aria-current={isActive ? "page" : undefined}
              >
                {renderIcon(tab.icon, tab.label, tab.badge, isActive)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

export default BottomNav;
