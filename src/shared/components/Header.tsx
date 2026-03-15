/**
 * Header component with navigation, user menu, and language selector
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

/**
 * Main header component with responsive navigation
 */
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { compareCount } = useCompareContext();
  const { favoritesCount } = useFavorites();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = useIsAdmin(user?.id);
  useMessageNotifications(user?.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user ?? null)
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-panel border-b border-border/50 shadow-sm backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] py-1 sm:py-2"
          : "bg-transparent border-b border-transparent pt-[env(safe-area-inset-top,0px)] py-2.5 sm:py-4"
      }`}
    >
      <div className={`container mx-auto px-4 sm:px-6 transition-all duration-300 ${scrolled ? "py-1 sm:py-2" : "py-0"}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img
              src={autoraLogo}
              alt="Autora Logo"
              className={`rounded-2xl object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 dark:brightness-110 dark:contrast-110 drop-shadow-sm ${
                scrolled ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10"
              }`}
            />
            <span className={`font-display font-bold tracking-wider transition-all duration-300 group-hover:tracking-[0.2em] ${
              scrolled ? "text-lg" : "text-xl"
            }`}>
              <span className="text-foreground">Auto</span><span className="text-primary">RA</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/">{t("nav.buy")}</NavLink>
            <NavLink to="/favorites" badge={favoritesCount > 0 ? favoritesCount : undefined}>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                {t("nav.favorites")}
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

          {/* Mobile: minimal actions (theme + hamburger for extra menu) */}
          <div className="md:hidden flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground rounded-2xl w-9 h-9"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </Button>
            <button
              className="p-2 text-foreground rounded-2xl hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
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
