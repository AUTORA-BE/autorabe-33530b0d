/**
 * Mobile navigation menu overlay
 * @module shared/components
 */

import { Link } from "react-router-dom";
import { Heart, MessageCircle, HelpCircle, GitCompareArrows, LayoutDashboard, Settings, LogOut, User, Menu } from "lucide-react";
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
}

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
}: MobileMenuProps) => {
  if (!isOpen) return null;

  const handleLink = () => onClose();

  return (
    <div
      className="md:hidden fixed inset-0 top-[60px] bg-background/95 backdrop-blur-xl z-50 overflow-y-auto"
      style={{ height: "calc(100vh - 60px)" }}
    >
      <nav className="flex flex-col p-6 gap-1">
        <Link
          to="/"
          className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors"
          onClick={handleLink}
        >
          {t("nav.buy")}
        </Link>
        <Link
          to="/sell"
          onMouseEnter={() => prefetchRoute("/sell")}
          className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors"
          onClick={handleLink}
        >
          {t("nav.sell")}
        </Link>
        <Link
          to="/favorites"
          onMouseEnter={() => prefetchRoute("/favorites")}
          className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3"
          onClick={handleLink}
        >
          <Heart className="w-5 h-5" />
          {t("nav.favorites")}
        </Link>
        <Link
          to="/compare"
          onMouseEnter={() => prefetchRoute("/compare")}
          className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3"
          onClick={handleLink}
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
          onClick={handleLink}
        >
          <HelpCircle className="w-5 h-5" />
          {t("nav.faq")}
        </Link>
        {user && (
          <Link
            to="/messages"
            onMouseEnter={() => prefetchRoute("/messages")}
            className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3"
            onClick={handleLink}
          >
            <MessageCircle className="w-5 h-5" />
            {t("nav.messages")}
            {hasUnread && (
              <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-2">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        <div className="h-px bg-border my-4" />

        {/* Language Selector */}
        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground mb-3">
            {t("nav.language") || "Langue"}
          </p>
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
              onClick={handleLink}
            >
              <LayoutDashboard className="w-5 h-5" />
              {t("nav.dashboard")}
            </Link>
            <Link
              to="/settings"
              onMouseEnter={() => prefetchRoute("/settings")}
              className="text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/50 transition-colors flex items-center gap-3"
              onClick={handleLink}
            >
              <Settings className="w-5 h-5" />
              {t("nav.settings")}
            </Link>
            <Button
              variant="outline"
              className="w-full rounded-2xl mt-4 h-12"
              onClick={() => {
                onLogout();
                onClose();
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
