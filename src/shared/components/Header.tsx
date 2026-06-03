/**
 * Header component with navigation, user menu, and language selector
 * Shrinks elegantly on scroll for immersive mobile experience
 * @module shared/components
 */

import { Menu, Heart, MessageCircle, GitCompareArrows, Sun, Moon, Bell, Search } from "lucide-react";
import autoraLogo from "@/assets/autora-logo.png";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useUnreadMessages, useMessageNotifications } from "@/features/messaging";
import { useCompareContext } from "@/features/compare";
import { useFavorites } from "@/features/favorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import NavLink from "./NavLink";
import DesktopActions from "./DesktopActions";
import MobileMenu from "./MobileMenu";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAutoPromptPush } from "@/hooks/useAutoPromptPush";
import { useLocalizedHref } from "@/lib/useLocalizedHref";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Pill "Rechercher" visible UNIQUEMENT sur la page d'accueil (root + locales)
  const isHomePage = /^\/(fr|nl|de|en)?\/?$/.test(location.pathname);
  const { toast } = useToast();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { compareCount } = useCompareContext();
  const { favoritesCount } = useFavorites();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = useIsAdmin(user?.id);
  const localized = useLocalizedHref();
  useMessageNotifications(user?.id);
  useAutoPromptPush(user?.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setUserProfile(null); return; }
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      setUserProfile(data);
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: t("logout.success"), description: t("logout.description") });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 text-foreground ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border/40 shadow-sm"
          : "bg-background/70 backdrop-blur-md border-b border-border/40 shadow-[0_2px_12px_-6px_hsl(var(--foreground)/0.15)]"
      }`}
      style={{ paddingTop: 'var(--safe-area-top, env(safe-area-inset-top, 0px))' }}
    >
      <div className={`container mx-auto px-4 sm:px-6 transition-all duration-300 ${scrolled ? "py-1 sm:py-2" : "py-1.5 sm:py-3"}`}>
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to={localized("/")} className="flex items-center gap-2 group shrink-0" aria-label="AutoRA — Accueil">
            <img
              src={autoraLogo}
              alt="AutoRA Logo"
              className={`rounded-2xl object-cover transition-all duration-300 group-hover:scale-105 drop-shadow-md ${
                scrolled ? "w-7 h-7 dark:brightness-110" : "w-8 h-8 sm:w-9 sm:h-9 brightness-110"
              }`}
            />
            <span className={`font-semibold tracking-wider transition-all duration-300 ${
              scrolled ? "text-base" : "text-lg sm:text-xl drop-shadow-md"
            }`}>
              <span className="text-foreground">Auto</span><span className="text-primary">RA</span>
            </span>
          </Link>

          {/* Desktop Navigation (lg+ to give tablets the hamburger drawer) */}
          <nav className="hidden lg:flex items-center gap-6">
            <NavLink to="/">{t("nav.buy")}</NavLink>
            <NavLink to="/recherche">{t("nav.search")}</NavLink>
            <NavLink to={user ? "/garage" : "/auth"} badge={favoritesCount > 0 ? favoritesCount : undefined}>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                {t("nav.garage")}
              </span>
            </NavLink>
            <NavLink to="/compare" badge={compareCount}>
              <span className="flex items-center gap-1.5">
                <GitCompareArrows className="w-4 h-4" />
                {t("nav.compare")}
              </span>
            </NavLink>
            {user && (
              <>
                <NavLink to="/mes-alertes">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4" />
                    Alertes
                  </span>
                </NavLink>
                <NavLink to="/messages" badge={hasUnread ? unreadCount : undefined}>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    {t("nav.messages")}
                  </span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <DesktopActions user={user} userProfile={userProfile} onLogout={handleLogout} t={t} isAdmin={isAdmin} />

          {/* Mobile + Tablet: theme toggle + hamburger (lg breakpoint to cover Galaxy Tab) */}
          <div className="lg:hidden flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
              className="text-muted-foreground hover:text-foreground rounded-xl min-w-11 min-h-11 w-11 h-11"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <button
              type="button"
              className="min-w-11 min-h-11 w-11 h-11 flex items-center justify-center text-foreground rounded-xl hover:bg-secondary/60 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Ouvrir le menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Mobile-only premium "Rechercher" pill button — visible UNIQUEMENT sur la page d'accueil */}
        {isHomePage && (
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
            scrolled ? "max-h-0 opacity-0 mt-0" : "max-h-14 opacity-100 mt-1.5"
          }`}
        >
          <button
            type="button"
            onClick={() => navigate("/recherche")}
            aria-label="Rechercher une voiture"
            className="group relative w-full h-11 rounded-full overflow-hidden
                       bg-card/35 backdrop-blur-xl
                       border border-primary/25 ring-1 ring-inset ring-white/5
                       shadow-[0_4px_24px_-8px_hsl(var(--primary)/0.25)]
                       hover:border-primary/60 active:scale-[0.98]
                       transition-all duration-300
                       hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.55),inset_0_1px_0_0_hsl(var(--primary)/0.15)]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {/* Glow sweep on hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full
                         bg-gradient-to-r from-transparent via-primary/25 to-transparent
                         group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
            />
            <span className="relative flex items-center justify-center gap-2 text-[13px] font-medium tracking-wide text-foreground">
              <Search className="w-4 h-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" strokeWidth={2.2} />
              <span>Rechercher</span>
            </span>
          </button>
        </div>
        )}

        {/* Mobile Menu (now a drawer — renders via portal-like AnimatePresence) */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          compareCount={compareCount}
          hasUnread={hasUnread}
          unreadCount={unreadCount}
          language={language}
          setLanguage={setLanguage}
          onLogout={handleLogout}
          onNavigate={navigate}
          t={t}
          isAdmin={isAdmin}
        />
      </div>
    </header>
  );
};

export default Header;
