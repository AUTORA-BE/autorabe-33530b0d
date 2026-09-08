/**
 * Header component with navigation, user menu, and language selector
 * Shrinks elegantly on scroll for immersive mobile experience
 * @module shared/components
 */

import { Menu, Heart, MessageCircle, GitCompareArrows, Sun, Moon, Bell } from "lucide-react";
import autoraLogo from "@/assets/autora-logo.png";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

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
import { BETA_BANNER_EVENT, BETA_BANNER_ID } from "@/components/BetaBanner";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [bannerOffset, setBannerOffset] = useState(0);
  const navigate = useNavigate();
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

  // Décalage sous le bandeau bêta : mesuré, jamais codé en dur.
  // Tant que le bandeau est visible à l'écran, le header se pose sur son bas ;
  // dès qu'il a défilé hors-champ (ou a été fermé), le header revient à top: 0.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = document.getElementById(BETA_BANNER_ID);
      const next = el ? Math.max(0, Math.round(el.getBoundingClientRect().bottom)) : 0;
      setBannerOffset((prev) => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener(BETA_BANNER_EVENT, schedule);
    const ro = new ResizeObserver(schedule);
    const el = document.getElementById(BETA_BANNER_ID);
    if (el) ro.observe(el);
    // Le bandeau est chargé en lazy : on re-observe quand il apparaît.
    const mo = new MutationObserver(() => {
      const node = document.getElementById(BETA_BANNER_ID);
      if (node) ro.observe(node);
      schedule();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener(BETA_BANNER_EVENT, schedule);
      ro.disconnect();
      mo.disconnect();
    };
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
      className={`fixed left-0 right-0 transition-colors duration-300 text-foreground ${
        scrolled
          ? "bg-background/85 dark:bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-sm"
          : "bg-background/70 dark:bg-background/90 backdrop-blur-md border-b border-border/40 shadow-[0_2px_12px_-6px_hsl(var(--foreground)/0.15)]"
      }`}
      style={{
        top: bannerOffset,
        zIndex: 'var(--z-header, 50)',
        // L'encoche est déjà absorbée par le bandeau quand il est visible.
        paddingTop: bannerOffset > 0 ? 0 : 'var(--safe-area-top, env(safe-area-inset-top, 0px))',
      }}
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

        {/* Pastille mobile « Rechercher » retirée : elle n'apparaissait que sur
            l'accueil, où le hero contient déjà un champ de recherche et la barre
            de navigation basse une entrée « Rechercher ». */}


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
