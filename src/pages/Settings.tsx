import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/shared/components";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell, Loader2, Cookie, Shield, BarChart3, Sparkles, User, Camera,
  Smartphone, Download, Trash2, FileText, Heart, Car, MessageCircle,
  ChevronRight, LogOut, Crown, Globe, Moon, Sun, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useFavorites } from "@/features/favorites";
import { useSubscription } from "@/features/subscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSellerListings } from "@/features/listings/hooks/useSellerListings";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  consented: boolean;
  timestamp?: number;
}

const COOKIE_STORAGE_KEY = "autora_cookie_preferences";

/* ─── stagger animation ─── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
};

/* ─── Glass Card component ─── */
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={item}
      className={`rounded-[20px] bg-card/50 backdrop-blur-xl border border-border/30 p-5 shadow-lg shadow-foreground/[0.02] ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── Settings Row ─── */
function SettingsRow({
  icon: Icon,
  label,
  description,
  onClick,
  rightElement,
  destructive = false,
}: {
  icon: any;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 py-3 transition-colors active:scale-[0.98] ${onClick ? "cursor-pointer" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          destructive ? "bg-destructive/10" : "bg-primary/10"
        }`}
      >
        <Icon className={`w-4.5 h-4.5 ${destructive ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}>
          {label}
        </p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
    </Wrapper>
  );
}

/* ─── Language flags ─── */
const langFlags: Record<Language, { flag: string; label: string }> = {
  fr: { flag: "🇫🇷", label: "Français" },
  nl: { flag: "🇧🇪", label: "Nederlands" },
  de: { flag: "🇩🇪", label: "Deutsch" },
  en: { flag: "🇬🇧", label: "English" },
};

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { subscribed, tier, openCustomerPortal } = useSubscription();
  const isAdmin = useIsAdmin(user?.id);
  const { favoritesCount } = useFavorites();
  const { totals } = useSellerListings();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    isLoading: pushLoading,
  } = usePushNotifications();

  // Dark mode
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("email_notifications_enabled")
        .eq("user_id", user.id)
        .single();

      if (preferences) {
        setEmailNotifications(preferences.email_notifications_enabled);
      } else {
        await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, email_notifications_enabled: true });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url);
      }

      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/avatars/")[1];
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, avatar_url: publicUrl }, { onConflict: "user_id" });
      setAvatarUrl(publicUrl);
      toast.success("Avatar mis à jour");
    } catch {
      toast.error("Erreur lors du téléchargement de l'avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, display_name: displayName.trim() }, { onConflict: "user_id" });
      toast.success("Profil mis à jour");
      setEditingName(false);
    } catch {
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsSaving(true);
    setEmailNotifications(enabled);
    try {
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, email_notifications_enabled: enabled },
          { onConflict: "user_id" }
        );
      toast.success(enabled ? t("settings.emailEnabled") : t("settings.emailDisabled"));
    } catch {
      setEmailNotifications(!enabled);
      toast.error(t("settings.errorUpdate"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("logout.success"));
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="page-gradient min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-gradient min-h-screen">
      <Header />
      <main className="container mx-auto px-4 max-w-lg pt-24 pb-28">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {/* ─── Hero Profile Card ─── */}
          <GlassCard className="text-center pt-8 pb-6">
            <div className="relative inline-block mb-4">
              <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-lg shadow-primary/10">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {displayName
                    ? displayName.charAt(0).toUpperCase()
                    : user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-[0.9] transition-transform"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {editingName ? (
              <div className="flex gap-2 max-w-[250px] mx-auto mb-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="text-center rounded-xl bg-background/50"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="rounded-xl"
                >
                  {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-xl font-bold text-foreground mb-1 hover:text-primary transition-colors"
              >
                {displayName || user?.email?.split("@")[0]}
              </button>
            )}

            <p className="text-xs text-muted-foreground mb-3">{user?.email}</p>

            {/* Badges */}
            <div className="flex items-center justify-center gap-2">
              {subscribed && tier && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Crown className="w-3 h-3" />
                  {tier.name}
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>

            {subscribed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={openCustomerPortal}
                className="mt-3 text-xs text-muted-foreground"
              >
                Gérer abonnement
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/pricing")}
                className="mt-4 rounded-full px-6 bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
              >
                <Crown className="w-4 h-4 mr-2" />
                Devenir Premium
              </Button>
            )}
          </GlassCard>

          {/* ─── Quick Links ─── */}
          <GlassCard>
            <SettingsRow
              icon={Car}
              label={`${t("nav.dashboard") || "Mes annonces"} (${totals.listings})`}
              description={t("nav.sell") || "Poster une nouvelle annonce"}
              onClick={() => navigate("/dashboard")}
            />
            <div className="border-t border-border/20" />
            <SettingsRow
              icon={Heart}
              label={`${t("nav.favorites")} (${favoritesCount})`}
              onClick={() => navigate("/favorites")}
            />
            <div className="border-t border-border/20" />
            <SettingsRow
              icon={MessageCircle}
              label={t("nav.messages")}
              onClick={() => navigate("/messages")}
            />
          </GlassCard>

          {/* ─── Seller Stats (premium) ─── */}
          {subscribed && (
            <GlassCard>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Statistiques vendeur
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Vues", value: totals.views },
                  { label: "Messages", value: totals.messages },
                  { label: "Favoris", value: totals.favorites },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center py-3 rounded-xl bg-background/30 border border-border/20"
                  >
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* ─── Settings ─── */}
          <GlassCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t("settings.title") || "Paramètres"}
            </h3>

            {/* Language */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">
                {t("nav.language") || "Langue"}
              </span>
              <div className="flex gap-1">
                {(Object.keys(langFlags) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all active:scale-[0.9] ${
                      language === lang
                        ? "bg-primary/15 ring-1 ring-primary/30"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {langFlags[lang].flag}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/20" />

            {/* Dark mode */}
            <SettingsRow
              icon={isDark ? Moon : Sun}
              label={isDark ? t("theme.dark") : t("theme.light")}
              rightElement={
                <Switch checked={isDark} onCheckedChange={toggleDark} />
              }
            />

            <div className="border-t border-border/20" />

            {/* Email notifications */}
            <SettingsRow
              icon={Bell}
              label={t("settings.emailNotifications")}
              rightElement={
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={handleToggleNotifications}
                  disabled={isSaving}
                />
              }
            />

            {/* Push notifications */}
            {pushSupported && (
              <>
                <div className="border-t border-border/20" />
                <SettingsRow
                  icon={Smartphone}
                  label="Notifications push"
                  rightElement={
                    <Switch
                      checked={pushSubscribed}
                      onCheckedChange={(c) => (c ? pushSubscribe() : pushUnsubscribe())}
                      disabled={pushLoading}
                    />
                  }
                />
              </>
            )}
          </GlassCard>

          {/* ─── Data & Privacy ─── */}
          <GlassCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Données & sécurité
            </h3>
            <SettingsRow
              icon={Download}
              label="Exporter mes données"
              description="RGPD – Télécharger en JSON"
              onClick={async () => {
                try {
                  toast.info("Préparation de l'export...");
                  const { data, error } = await supabase.functions.invoke("export-user-data");
                  if (error) throw error;
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `autora-export-${new Date().toISOString().split("T")[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Export téléchargé");
                } catch {
                  toast.error("Erreur lors de l'export");
                }
              }}
            />
            <div className="border-t border-border/20" />
            <SettingsRow
              icon={Cookie}
              label="Préférences cookies"
              onClick={() => {
                localStorage.removeItem(COOKIE_STORAGE_KEY);
                window.location.reload();
              }}
            />
          </GlassCard>

          {/* ─── Danger Zone ─── */}
          <GlassCard>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <SettingsRow
                    icon={Trash2}
                    label="Supprimer mon compte"
                    description="Irréversible – toutes les données seront effacées"
                    destructive
                    onClick={() => {}}
                  />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos données seront supprimées : annonces,
                    messages, favoris, alertes et profil.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        toast.info("Suppression en cours...");
                        const { error } = await supabase.functions.invoke("delete-account");
                        if (error) throw error;
                        toast.success("Compte supprimé. Au revoir !");
                        await supabase.auth.signOut();
                        navigate("/");
                      } catch {
                        toast.error("Erreur lors de la suppression du compte");
                      }
                    }}
                  >
                    Oui, supprimer mon compte
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GlassCard>

          {/* ─── Sign Out ─── */}
          <motion.div variants={item}>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full rounded-[20px] py-4 text-destructive/70 hover:text-destructive hover:bg-destructive/5 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("nav.logout")}
            </Button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
