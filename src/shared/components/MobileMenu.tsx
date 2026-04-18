/**
 * Mobile navigation menu — premium drawer overlay with smooth animation
 * @module shared/components
 */

import { Link } from "react-router-dom";
import { Heart, MessageCircle, HelpCircle, GitCompareArrows, LayoutDashboard, Settings, LogOut, User, Mail, Bell, ShieldCheck, Home, Car, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect } from "react";

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

const menuLinkClass = "text-foreground font-medium py-3 px-4 rounded-2xl hover:bg-secondary/60 active:bg-secondary/80 transition-all flex items-center gap-3 text-sm";

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
  const handleLink = () => onClose();

  // Lock body scroll while menu is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="md:hidden fixed top-0 right-0 bottom-0 w-[88%] max-w-[380px] bg-background/98 backdrop-blur-2xl z-[91] flex flex-col shadow-2xl border-l border-border/20"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
              <span className="text-sm font-semibold text-foreground tracking-wide">Menu</span>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {/* CTA Vendre */}
              <Link
                to="/sell"
                onMouseEnter={() => prefetchRoute("/sell")}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-[0.98] mb-3"
                onClick={handleLink}
              >
                <Car className="w-4.5 h-4.5" />
                {language === "nl" ? "Mijn auto verkopen" : "Vendre ma voiture"}
              </Link>

              <div className="h-px bg-border/30 my-2" />

              <Link to="/" className={menuLinkClass} onClick={handleLink}>
                <Home className="w-4.5 h-4.5 text-primary/70" />
                {t("nav.buy")}
              </Link>
              <Link to="/favorites" onMouseEnter={() => prefetchRoute("/favorites")} className={menuLinkClass} onClick={handleLink}>
                <Heart className="w-4.5 h-4.5 text-primary/70" />
                {t("nav.favorites")}
              </Link>
              <Link to="/compare" onMouseEnter={() => prefetchRoute("/compare")} className={menuLinkClass} onClick={handleLink}>
                <GitCompareArrows className="w-4.5 h-4.5 text-primary/70" />
                {t("nav.compare")}
                {compareCount > 0 && (
                  <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 ml-auto">
                    {compareCount}
                  </span>
                )}
              </Link>
              <Link to="/faq" onMouseEnter={() => prefetchRoute("/faq")} className={menuLinkClass} onClick={handleLink}>
                <HelpCircle className="w-4.5 h-4.5 text-primary/70" />
                {t("nav.faq")}
              </Link>
              <Link to="/contact" onMouseEnter={() => prefetchRoute("/contact")} className={menuLinkClass} onClick={handleLink}>
                <Mail className="w-4.5 h-4.5 text-primary/70" />
                Contact
              </Link>

              {user && (
                <>
                  <div className="h-px bg-border/30 my-2" />
                  <Link to="/mes-alertes" onMouseEnter={() => prefetchRoute("/mes-alertes")} className={menuLinkClass} onClick={handleLink}>
                    <Bell className="w-4.5 h-4.5 text-primary/70" />
                    {language === "nl" ? "Mijn meldingen" : "Mes alertes"}
                  </Link>
                  <Link to="/messages" onMouseEnter={() => prefetchRoute("/messages")} className={menuLinkClass} onClick={handleLink}>
                    <MessageCircle className="w-4.5 h-4.5 text-primary/70" />
                    {t("nav.messages")}
                    {hasUnread && (
                      <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 ml-auto">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <div className="h-px bg-border/30 my-3" />

              {/* Language */}
              <div className="px-1 py-2">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-[0.15em]">
                  {t("nav.language") || "Langue"}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["fr", "nl", "de", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                        language === lang
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary/50 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/30 my-3" />

              {user ? (
                <div className="space-y-0.5">
                  <Link to="/dashboard" onMouseEnter={() => prefetchRoute("/dashboard")} className={menuLinkClass} onClick={handleLink}>
                    <LayoutDashboard className="w-4.5 h-4.5 text-primary/70" />
                    {t("nav.dashboard")}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/reports" className={menuLinkClass} onClick={handleLink}>
                      <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to="/settings" onMouseEnter={() => prefetchRoute("/settings")} className={menuLinkClass} onClick={handleLink}>
                    <Settings className="w-4.5 h-4.5 text-primary/70" />
                    {t("nav.settings")}
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl mt-4 h-11 text-sm"
                    onClick={() => { onLogout(); onClose(); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.logout")}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full rounded-2xl mt-3 h-11 text-sm font-semibold"
                  onClick={() => { onNavigate("/auth"); onClose(); }}
                >
                  <User className="w-4 h-4 mr-2" />
                  {t("nav.login")}
                </Button>
              )}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default MobileMenu;
