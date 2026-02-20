/**
 * Mobile navigation menu overlay
 * @module shared/components
 */

import { Link } from "react-router-dom";
import { Heart, MessageCircle, HelpCircle, GitCompareArrows, LayoutDashboard, Settings, LogOut, User, Mail, Bell, ShieldCheck, Home, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  compareCount: number;
  hasUnread: boolean;
  unreadCount: number;
  language: "fr" | "nl" | "de" | "en";
  setLanguage: (lang: "fr" | "nl" | "de" | "en") => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  t: (key: string) => string;
  isAdmin?: boolean;
}

const menuLinkClass = "text-foreground font-medium py-3.5 px-5 rounded-2xl hover:bg-secondary/60 active:bg-secondary/80 transition-all flex items-center gap-3.5 text-[15px]";

const MobileMenu = ({
  isOpen,
  onClose,
  user,
  compareCount,
  hasUnread,
  unreadCount,
  language,
  setLanguage,
  onLogout,
  onNavigate,
  t,
  isAdmin,
}: MobileMenuProps) => {
  if (!isOpen) return null;

  const handleLink = () => onClose();

  return (
    <div
      className="md:hidden fixed inset-0 top-[60px] bg-background/95 backdrop-blur-xl z-50 overflow-y-auto"
      style={{ height: "calc(100vh - 60px)" }}
    >
      <nav className="flex flex-col p-5 gap-0.5">
        {/* CTA Vendre */}
        <Link
          to="/sell"
          onMouseEnter={() => prefetchRoute("/sell")}
          className="flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all active:scale-95 mb-3"
          onClick={handleLink}
        >
          <Car className="w-5 h-5" />
          {language === "nl" ? "Mijn auto verkopen" : "Vendre ma voiture"}
        </Link>

        <div className="h-px bg-border my-2" />

        {/* Navigation principale */}
        <Link to="/" className={menuLinkClass} onClick={handleLink}>
          <Home className="w-5 h-5 text-primary/70" />
          {t("nav.buy")}
        </Link>
        <Link
          to="/favorites"
          onMouseEnter={() => prefetchRoute("/favorites")}
          className={menuLinkClass}
          onClick={handleLink}
        >
          <Heart className="w-5 h-5 text-primary/70" />
          {t("nav.favorites")}
        </Link>
        <Link
          to="/compare"
          onMouseEnter={() => prefetchRoute("/compare")}
          className={menuLinkClass}
          onClick={handleLink}
        >
          <GitCompareArrows className="w-5 h-5 text-primary/70" />
          {t("nav.compare")}
          {compareCount > 0 && (
            <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 ml-auto">
              {compareCount}
            </span>
          )}
        </Link>
        <Link
          to="/faq"
          onMouseEnter={() => prefetchRoute("/faq")}
          className={menuLinkClass}
          onClick={handleLink}
        >
          <HelpCircle className="w-5 h-5 text-primary/70" />
          {t("nav.faq")}
        </Link>
        <Link
          to="/contact"
          onMouseEnter={() => prefetchRoute("/contact")}
          className={menuLinkClass}
          onClick={handleLink}
        >
          <Mail className="w-5 h-5 text-primary/70" />
          Contact
        </Link>

        {user && (
          <>
            <div className="h-px bg-border my-2" />
            <Link
              to="/mes-alertes"
              onMouseEnter={() => prefetchRoute("/mes-alertes")}
              className={menuLinkClass}
              onClick={handleLink}
            >
              <Bell className="w-5 h-5 text-primary/70" />
              {language === "nl" ? "Mijn meldingen" : "Mes alertes"}
            </Link>
            <Link
              to="/messages"
              onMouseEnter={() => prefetchRoute("/messages")}
              className={menuLinkClass}
              onClick={handleLink}
            >
              <MessageCircle className="w-5 h-5 text-primary/70" />
              {t("nav.messages")}
              {hasUnread && (
                <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-2 ml-auto">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </>
        )}

        <div className="h-px bg-border my-3" />

        {/* Language Selector */}
        <div className="px-2 py-2">
          <p className="text-xs text-muted-foreground mb-2.5 font-medium uppercase tracking-wide">
            {t("nav.language") || "Langue"}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {(["fr", "nl", "de", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                  language === lang
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 text-foreground hover:bg-secondary"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border my-3" />

        {user ? (
          <div className="space-y-0.5">
            <Link
              to="/dashboard"
              onMouseEnter={() => prefetchRoute("/dashboard")}
              className={menuLinkClass}
              onClick={handleLink}
            >
              <LayoutDashboard className="w-5 h-5 text-primary/70" />
              {t("nav.dashboard")}
            </Link>
            {isAdmin && (
              <Link
                to="/admin/reports"
                className={menuLinkClass}
                onClick={handleLink}
              >
                <ShieldCheck className="w-5 h-5 text-primary" />
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/settings"
              onMouseEnter={() => prefetchRoute("/settings")}
              className={menuLinkClass}
              onClick={handleLink}
            >
              <Settings className="w-5 h-5 text-primary/70" />
              {t("nav.settings")}
            </Link>
            <Button
              variant="outline"
              className="w-full rounded-2xl mt-4 h-12 text-[15px]"
              onClick={() => {
                onLogout();
                onClose();
              }}
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t("nav.logout")}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full rounded-2xl mt-3 h-12 text-[15px] font-semibold"
            onClick={() => {
              onNavigate("/auth");
              onClose();
            }}
          >
            <User className="w-5 h-5 mr-2" />
            {t("nav.login")}
          </Button>
        )}
      </nav>
    </div>
  );
};

export default MobileMenu;
