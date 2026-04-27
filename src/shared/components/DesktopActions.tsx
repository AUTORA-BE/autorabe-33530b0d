/**
 * Desktop header actions: theme toggle, language selector, and user menu
 * @module shared/components
 */

import { User, LogOut, HelpCircle, LayoutDashboard, Settings, ChevronDown, Globe, Sun, Moon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useLanguage, getLanguageLabel } from "@/contexts/LanguageContext";
import { useLocalizedHref } from "@/lib/useLocalizedHref";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DesktopActionsProps {
  user: SupabaseUser | null;
  userProfile: { avatar_url: string | null; display_name: string | null } | null;
  onLogout: () => void;
  t: (key: string) => string;
  isAdmin?: boolean;
}

const DesktopActions = ({ user, userProfile, onLogout, t, isAdmin }: DesktopActionsProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const localized = useLocalizedHref();
  void localized;
  void localized;

  return (
    <div className="hidden lg:flex items-center gap-2">
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

      {/* Sell CTA */}
      <Button
        onClick={() => navigate("/sell")}
        className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-primary-foreground font-semibold px-5 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:brightness-110 transition-all duration-300 relative"
        size="sm"
      >
        Vendre ma voiture
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-[10px] font-bold text-amber-950 leading-none shadow-sm">
          0€
        </span>
      </Button>

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
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/admin/reports")} className="cursor-pointer rounded-xl">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer rounded-xl">
              <Settings className="w-4 h-4 mr-2" />
              {t("nav.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/faq")} className="cursor-pointer rounded-xl">
              <HelpCircle className="w-4 h-4 mr-2" />
              {t("nav.faq")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive rounded-xl">
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
  );
};

export default DesktopActions;
