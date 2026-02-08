/**
 * Header component with navigation, user menu, and language selector
 * @module shared/components
 */

import { Menu, User, LogOut, Heart, MessageCircle, HelpCircle, GitCompareArrows, LayoutDashboard, Settings, ChevronDown, Globe, Sun, Moon } from "lucide-react";
import autoraLogo from "@/assets/autora-logo.png";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useUnreadMessages } from "@/features/messaging";
import { useCompareContext } from "@/features/compare";
import { useLanguage, getLanguageLabel } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Navigation link component with active state and optional badge
 */
interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  badge?: number;
}

const NavLink = ({ to, children, badge }: NavLinkProps) => {
  const location = useLocation();
  const handlePrefetch = useCallback(() => prefetchRoute(to), [to]);
  
  return (
    <Link 
      to={to}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={`relative font-medium transition-all duration-200 hover:scale-105 ${
        location.pathname === to 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {location.pathname === to && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-scale-in" />
      )}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 animate-scale-in">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
};

/**
 * Main header component with responsive navigation
 */
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { compareCount } = useCompareContext();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

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
    toast({
      title: t("logout.success"),
      description: t("logout.description"),
    });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "glass-panel border-b border-border/50 shadow-sm backdrop-blur-xl py-2" 
          : "bg-transparent border-b border-transparent py-4"
      }`}
    >
      <div className={`container mx-auto px-6 transition-all duration-300 ${scrolled ? "py-2" : "py-0"}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={autoraLogo} 
              alt="Autora Logo" 
              className={`rounded-2xl object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 ${
                scrolled ? "w-8 h-8" : "w-10 h-10"
              }`}
            />
            <span className={`font-display font-bold text-primary transition-all duration-300 group-hover:tracking-wide ${
              scrolled ? "text-lg" : "text-xl"
            }`}>
              Autora
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/">{t("nav.buy")}</NavLink>
            <NavLink to="/sell">{t("nav.sell")}</NavLink>
            <NavLink to="/favorites">
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
              <NavLink to="/messages" badge={hasUnread ? unreadCount : undefined}>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  {t("nav.messages")}
                </span>
              </NavLink>
            )}
          </nav>

          {/* Desktop Actions - Right side */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground rounded-2xl"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground rounded-2xl">
                  <Globe className="w-4 h-4" />
                  {getLanguageLabel(language)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px] rounded-2xl bg-popover border border-border">
                <DropdownMenuItem onClick={() => setLanguage("fr")} className={`rounded-xl cursor-pointer ${language === "fr" ? "font-medium bg-accent" : ""}`}>
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("nl")} className={`rounded-xl cursor-pointer ${language === "nl" ? "font-medium bg-accent" : ""}`}>
                  🇧🇪 Nederlands
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("de")} className={`rounded-xl cursor-pointer ${language === "de" ? "font-medium bg-accent" : ""}`}>
                  🇩🇪 Deutsch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className={`rounded-xl cursor-pointer ${language === "en" ? "font-medium bg-accent" : ""}`}>
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-2xl gap-2 shadow-sm hover:shadow-lg transition-shadow pl-1.5">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.display_name || user.email || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {(userProfile?.display_name || user.email || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {userProfile?.display_name || user.email?.split("@")[0]}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer rounded-xl">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t("nav.dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer rounded-xl">
                    <Settings className="w-4 h-4 mr-2" />
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/faq")} className="cursor-pointer rounded-xl">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    {t("nav.faq")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500 rounded-xl">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="rounded-2xl shadow-sm hover:shadow-lg transition-shadow" onClick={() => navigate("/auth")}>
                <User className="w-4 h-4 mr-2" />
                {t("nav.login")}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground rounded-2xl"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <button
              className="p-2 text-foreground rounded-2xl hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 top-[60px] bg-background/95 backdrop-blur-xl z-50 overflow-y-auto"
            style={{ height: 'calc(100vh - 60px)' }}
          >
            <nav className="flex flex-col p-6 gap-1">
              <Link 
                to="/" 
                className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors" 
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.buy")}
              </Link>
              <Link 
                to="/sell"
                onMouseEnter={() => prefetchRoute("/sell")}
                className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors" 
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.sell")}
              </Link>
              <Link 
                to="/favorites"
                onMouseEnter={() => prefetchRoute("/favorites")}
                className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="w-5 h-5" />
                {t("nav.favorites")}
              </Link>
              <Link 
                to="/compare"
                onMouseEnter={() => prefetchRoute("/compare")}
                className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <GitCompareArrows className="w-5 h-5" />
                {t("nav.compare")}
                {compareCount > 0 && (
                  <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-2">
                    {compareCount}
                  </span>
                )}
              </Link>
              <Link 
                to="/faq"
                onMouseEnter={() => prefetchRoute("/faq")}
                className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <HelpCircle className="w-5 h-5" />
                {t("nav.faq")}
              </Link>
              {user && (
                <Link 
                  to="/messages"
                  onMouseEnter={() => prefetchRoute("/messages")}
                  className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageCircle className="w-5 h-5" />
                  {t("nav.messages")}
                  {hasUnread && (
                    <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-2">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="h-px bg-border my-4" />

              {/* Language Selector Mobile */}
              <div className="px-4 py-2">
                <p className="text-sm text-muted-foreground mb-3">{t("nav.language") || "Langue"}</p>
                <div className="grid grid-cols-4 gap-2">
                  {(["fr", "nl", "de", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-2 px-3 rounded-2xl text-sm font-medium transition-colors ${
                        language === lang 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border my-4" />
              
              {user ? (
                <>
                  <Link 
                    to="/dashboard"
                    onMouseEnter={() => prefetchRoute("/dashboard")}
                    className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    {t("nav.dashboard")}
                  </Link>
                  <Link 
                    to="/settings"
                    onMouseEnter={() => prefetchRoute("/settings")}
                    className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    {t("nav.settings")}
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-2xl mt-4 h-12" 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full rounded-2xl mt-4 h-12" 
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="w-5 h-5 mr-2" />
                  {t("nav.login")}
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
