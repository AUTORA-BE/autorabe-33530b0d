import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Header, Footer, BackButton } from "@/shared/components";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell, Loader2, Cookie, Shield, BarChart3, Camera,
  Smartphone, Download, Trash2, Heart, Car, MessageCircle,
  LogOut, Crown, Globe, Moon, Sun, Search as SearchIcon,
  KeyRound, LogOut as LogoutAll, FileText, ScrollText, Mail,
  Bell as AlertBell, ChevronRight, Info, X, User as UserIcon,
  SlidersHorizontal, Lock, CreditCard, AlertTriangle, Pencil,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useFavorites } from "@/features/favorites";
import { useSubscription } from "@/features/subscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSellerListings } from "@/features/listings/hooks/useSellerListings";
import { useLocalStorage } from "@/shared/hooks";
import {
  SettingsSection,
  SettingsRow,
  ChangePasswordModal,
  useSettingsSearch,
  type SettingsEntry,
} from "@/features/settings";

const COOKIE_STORAGE_KEY = "autora_cookie_preferences";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

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

  const [search, setSearch] = useState("");
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useLocalStorage<string>("autora_settings_active_category", "activity");

  const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
    { id: "activity", label: "Mon activité", icon: BarChart3 },
    { id: "account", label: "Compte", icon: UserIcon },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "prefs", label: "Préférences", icon: SlidersHorizontal },
    { id: "notifs", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Confidentialité", icon: Shield },
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "about", label: "À propos", icon: Info },
    { id: "danger", label: "Zone danger", icon: AlertTriangle },
  ];

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

  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
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
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 2 Mo"); return; }
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/avatars/")[1];
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage
        .from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles")
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
      await supabase.from("profiles")
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
      await supabase.from("user_preferences").upsert(
        { user_id: user.id, email_notifications_enabled: enabled },
        { onConflict: "user_id" },
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

  const handleSignOutAll = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      toast.success("Déconnecté de tous les autres appareils");
    } catch {
      toast.error("Impossible de déconnecter les autres appareils");
    }
  };

  const handleExport = async () => {
    try {
      toast.info(t("profile.exportPreparing"));
      const { data, error } = await supabase.functions.invoke("export-user-data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `autora-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("profile.exportSuccess"));
    } catch {
      toast.error(t("profile.exportError"));
    }
  };

  const handleResetCookies = () => {
    localStorage.removeItem(COOKIE_STORAGE_KEY);
    window.location.reload();
  };

  // Search registry — built after we have nav helpers
  const searchEntries = useMemo<SettingsEntry[]>(() => {
    if (!user) return [];
    return [
      { id: "listings", section: "Mon activité", label: "Mes annonces", action: () => navigate("/dashboard"), keywords: ["voiture", "vendre"] },
      { id: "favs", section: "Mon activité", label: "Favoris", action: () => navigate("/favorites"), keywords: ["coeur", "like"] },
      { id: "msg", section: "Mon activité", label: "Messages", action: () => navigate("/messages"), keywords: ["chat", "conversations"] },
      { id: "alerts", section: "Mon activité", label: "Mes alertes", action: () => navigate("/mes-alertes"), keywords: ["notifications", "recherche"] },
      { id: "profile", section: "Compte", label: "Nom & avatar", action: () => { setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); } },
      { id: "pwd", section: "Sécurité", label: "Changer le mot de passe", action: () => setPwdModalOpen(true), keywords: ["password", "sécurité"] },
      { id: "logoutall", section: "Sécurité", label: "Déconnecter les autres appareils", action: handleSignOutAll, keywords: ["sessions"] },
      { id: "lang", section: "Préférences", label: "Langue", action: () => {}, keywords: ["language", "français", "nederlands"] },
      { id: "theme", section: "Préférences", label: "Thème sombre", action: toggleDark, keywords: ["dark mode", "couleur"] },
      { id: "email", section: "Notifications", label: "Notifications par email", action: () => {}, keywords: ["mail"] },
      { id: "push", section: "Notifications", label: "Notifications push", action: () => {}, keywords: ["mobile"] },
      { id: "cookies", section: "Confidentialité", label: "Préférences cookies", action: handleResetCookies, keywords: ["rgpd", "tracking"] },
      { id: "export", section: "Confidentialité", label: "Exporter mes données", description: "RGPD", action: handleExport, keywords: ["rgpd", "download"] },
      { id: "sub", section: "Abonnement", label: subscribed ? "Gérer mon abonnement" : "Passer Premium", action: subscribed ? openCustomerPortal : () => navigate("/pricing") },
      { id: "cgu", section: "À propos", label: "Conditions d'utilisation", action: () => navigate("/cgu") },
      { id: "privacy", section: "À propos", label: "Confidentialité", action: () => navigate("/confidentialite") },
      { id: "contact", section: "À propos", label: "Contacter le support", action: () => navigate("/contact") },
      { id: "delete", section: "Zone danger", label: "Supprimer mon compte", action: () => {}, keywords: ["effacer"] },
      { id: "logout", section: "Zone danger", label: "Se déconnecter", action: handleSignOut },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, subscribed, navigate]);

  const searchResults = useSettingsSearch(searchEntries, search);
  const isSearching = search.trim().length > 0;

  if (isLoading) {
    return (
      <div className="page-gradient min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-gradient min-h-screen">
      <SEOHead noIndex />
      <Header />
      <main className="container mx-auto px-3 sm:px-4 max-w-lg md:max-w-6xl md:px-8 pt-20 pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <div className="px-1 mb-3 flex items-center justify-between">
          <BackButton to="/" />
        </div>

        {/* Sticky search */}
        <div className="sticky top-16 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-1 pb-3 mb-4 bg-background/70 backdrop-blur-xl">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans les paramètres…"
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-secondary/70 border border-border/30 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted-foreground/15 flex items-center justify-center"
                aria-label="Effacer"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  Aucun résultat pour <span className="font-medium text-foreground">"{search}"</span>
                </div>
              ) : (
                <div className="rounded-[14px] bg-card/60 backdrop-blur-xl border border-border/30 px-3 divide-y divide-border/40">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { r.action(); setSearch(""); }}
                      className="w-full flex items-center gap-3 py-3 text-left active:scale-[0.985] transition-transform"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] text-foreground font-medium truncate">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {r.section}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="sections"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Hero profile — vertical on mobile, horizontal banner on md+ */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="text-center pt-2 pb-2 md:text-left md:flex md:flex-row md:items-center md:justify-between md:gap-6 md:p-6 md:rounded-2xl md:bg-card/40 md:backdrop-blur-md md:border md:border-border/40 md:shadow-sm"
              >
                <div className="md:flex md:items-center md:gap-5 md:flex-1 md:min-w-0">
                  <div className="relative inline-block mb-3 md:mb-0 md:flex-shrink-0">
                    <Avatar className="h-24 w-24 md:h-16 md:w-16 border-2 border-primary/20 shadow-lg shadow-primary/10">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback className="text-3xl md:text-xl bg-primary/10 text-primary">
                        {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-9 h-9 md:w-7 md:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-[0.9] transition-transform"
                    >
                      {isUploadingAvatar ? <Loader2 className="h-4 w-4 md:h-3 md:w-3 animate-spin" /> : <Camera className="h-4 w-4 md:h-3 md:w-3" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div className="md:flex-1 md:min-w-0">
                    {editingName ? (
                      <div className="flex gap-2 max-w-[260px] mx-auto mb-2 md:mx-0">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          maxLength={50}
                          className="text-center md:text-left rounded-xl bg-background/50"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile} className="rounded-xl">
                          {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                        </Button>
                      </div>
                    ) : (
                      <div className="md:flex md:items-center md:gap-2 md:flex-wrap">
                        <button
                          onClick={() => setEditingName(true)}
                          className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-0 hover:text-primary transition-colors"
                        >
                          {displayName || user?.email?.split("@")[0]}
                        </button>
                        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-600 border border-amber-500/30">
                          Bêta
                        </span>
                        {subscribed && tier && (
                          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            <Crown className="w-3 h-3" />
                            {tier.name}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mb-3 md:mb-0 md:mt-1">{user?.email}</p>

                    {/* Mobile-only badges */}
                    <div className="flex items-center justify-center gap-2 flex-wrap md:hidden">
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
                  </div>
                </div>

                {!subscribed && (
                  <Button
                    onClick={() => navigate("/pricing")}
                    className="mt-4 md:mt-0 md:flex-shrink-0 rounded-full px-6 bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t("profile.becomePremium")}
                  </Button>
                )}
              </motion.div>


              {/* Two-column layout on desktop: sidebar nav + content panel. Mobile keeps single column. */}
              <div className="md:grid md:grid-cols-4 md:gap-8 md:items-start space-y-6 md:space-y-0">
                {/* Sidebar nav (desktop only) */}
                <aside className="hidden md:block md:col-span-1 sticky top-32">
                  <nav className="rounded-2xl bg-card/40 backdrop-blur-md border border-border/40 p-2 space-y-0.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const active = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                            active
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${cat.id === "danger" && !active ? "text-destructive/70" : ""}`} strokeWidth={1.75} />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </aside>

                {/* Content panel */}
                <div className="md:col-span-3 space-y-6">
                  {/* Mon activité */}
                  <div className={activeCategory !== "activity" ? "md:hidden" : ""}>
                    <SettingsSection title="Mon activité">
                      <SettingsRow icon={Car} tone="blue" label="Mes annonces" description={`${totals.listings} publiée(s)`} onClick={() => navigate("/dashboard")} />
                      <SettingsRow icon={Heart} tone="blue" label="Favoris" description={`${favoritesCount} véhicule(s)`} onClick={() => navigate("/favorites")} />
                      <SettingsRow icon={MessageCircle} tone="blue" label="Messages" onClick={() => navigate("/messages")} />
                      <SettingsRow icon={AlertBell} tone="blue" label="Mes alertes" onClick={() => navigate("/mes-alertes")} />
                    </SettingsSection>
                  </div>

                  {/* Seller stats (premium) — show under activity on desktop */}
                  {subscribed && (
                    <div className={activeCategory !== "activity" ? "md:hidden" : ""}>
                      <SettingsSection title="Statistiques vendeur">
                        <div className="py-2">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: t("profile.views"), value: totals.views, icon: BarChart3 },
                              { label: t("profile.messages"), value: totals.messages, icon: MessageCircle },
                              { label: t("profile.favorites"), value: totals.favorites, icon: Heart },
                            ].map((s) => (
                              <div key={s.label} className="text-center py-3 rounded-xl bg-background/30 border border-border/20">
                                <p className="text-lg font-bold text-foreground">{s.value}</p>
                                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </SettingsSection>
                    </div>
                  )}

                  {/* Compte — mobile rows */}
                  <div className={`md:hidden ${activeCategory !== "account" ? "" : ""}`}>
                    <SettingsSection title="Compte">
                      <SettingsRow icon={Camera} tone="indigo" label="Modifier l'avatar" onClick={() => fileInputRef.current?.click()} />
                      <SettingsRow icon={FileText} tone="indigo" label="Nom affiché" description={displayName || "—"} onClick={() => setEditingName(true)} />
                      <SettingsRow icon={Mail} tone="indigo" label="Email" description={user?.email} noChevron />
                    </SettingsSection>
                  </div>

                  {/* Compte — desktop bento with read-only fields + edit button */}
                  <div className={`hidden md:block ${activeCategory !== "account" ? "md:hidden" : ""}`}>
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] px-4">Compte</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Nom affiché */}
                        <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 p-5">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nom affiché</label>
                          {editingName ? (
                            <div className="flex gap-2">
                              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} autoFocus className="rounded-xl" />
                              <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile} className="rounded-xl">
                                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[15px] font-medium text-foreground truncate">{displayName || "—"}</p>
                              <Button size="sm" variant="ghost" onClick={() => setEditingName(true)} className="rounded-xl text-primary h-8 px-3 -mr-2">
                                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Email */}
                        <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 p-5">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Email</label>
                          <p className="text-[15px] font-medium text-foreground truncate">{user?.email}</p>
                        </div>
                        {/* Avatar */}
                        <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 p-5 col-span-2 flex items-center gap-4">
                          <Avatar className="h-14 w-14 border border-border/40">
                            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(displayName || user?.email || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avatar</p>
                            <p className="text-xs text-muted-foreground mt-0.5">PNG ou JPG, max 2 Mo</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar} className="rounded-xl">
                            {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="w-3.5 h-3.5 mr-1.5" /> Changer</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sécurité */}
                  <div className={activeCategory !== "security" ? "md:hidden" : ""}>
                    <SettingsSection title="Sécurité" footer="Gardez votre compte en sécurité. Changez régulièrement votre mot de passe.">
                      <SettingsRow icon={KeyRound} tone="red" label="Changer le mot de passe" onClick={() => setPwdModalOpen(true)} />
                      <SettingsRow
                        icon={LogoutAll}
                        tone="red"
                        label="Déconnecter les autres appareils"
                        description="Termine toutes les sessions sauf celle-ci"
                        onClick={handleSignOutAll}
                      />
                    </SettingsSection>
                  </div>

                  {/* Préférences */}
                  <div className={activeCategory !== "prefs" ? "md:hidden" : ""}>
                    <SettingsSection title="Préférences">
                      <div className="flex items-center gap-3 py-2.5 px-1 min-h-[52px]">
                        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-sm">
                          <Globe className="w-[15px] h-[15px] text-white" strokeWidth={2.2} />
                        </div>
                        <span className="text-[15px] font-medium text-foreground flex-1">Langue</span>
                        <div className="flex gap-1">
                          {(Object.keys(langFlags) as Language[]).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setLanguage(lang)}
                              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all active:scale-[0.9] ${
                                language === lang ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-secondary"
                              }`}
                            >
                              {langFlags[lang].flag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <SettingsRow
                        icon={isDark ? Moon : Sun}
                        tone="emerald"
                        label={isDark ? "Thème sombre" : "Thème clair"}
                        rightElement={<Switch checked={isDark} onCheckedChange={toggleDark} />}
                      />
                    </SettingsSection>
                  </div>

                  {/* Notifications */}
                  <div className={activeCategory !== "notifs" ? "md:hidden" : ""}>
                    <SettingsSection title="Notifications">
                      <SettingsRow
                        icon={Bell}
                        tone="orange"
                        label="Notifications par email"
                        rightElement={
                          <Switch
                            checked={emailNotifications}
                            onCheckedChange={handleToggleNotifications}
                            disabled={isSaving}
                          />
                        }
                      />
                      {pushSupported && (
                        <SettingsRow
                          icon={Smartphone}
                          tone="orange"
                          label="Notifications push"
                          rightElement={
                            <Switch
                              checked={pushSubscribed}
                              onCheckedChange={(c) => (c ? pushSubscribe() : pushUnsubscribe())}
                              disabled={pushLoading}
                            />
                          }
                        />
                      )}
                    </SettingsSection>
                  </div>

                  {/* Confidentialité */}
                  <div className={activeCategory !== "privacy" ? "md:hidden" : ""}>
                    <SettingsSection title="Confidentialité" footer="Vos données vous appartiennent. Conforme RGPD.">
                      <SettingsRow icon={Cookie} tone="violet" label="Préférences cookies" onClick={handleResetCookies} />
                      <SettingsRow icon={Download} tone="violet" label="Exporter mes données" description="Téléchargement JSON" onClick={handleExport} />
                    </SettingsSection>
                  </div>

                  {/* Abonnement */}
                  <div className={activeCategory !== "subscription" ? "md:hidden" : ""}>
                    <SettingsSection title="Abonnement">
                      {subscribed && tier ? (
                        <>
                          <SettingsRow icon={Crown} tone="gold" label="Plan actuel" description={tier.name} noChevron />
                          <SettingsRow icon={Crown} tone="gold" label="Gérer mon abonnement" onClick={openCustomerPortal} />
                        </>
                      ) : (
                        <SettingsRow icon={Crown} tone="gold" label="Passer Premium" description="Boostez vos annonces" onClick={() => navigate("/pricing")} />
                      )}
                    </SettingsSection>
                  </div>

                  {/* À propos */}
                  <div className={activeCategory !== "about" ? "md:hidden" : ""}>
                    <SettingsSection title="À propos">
                      <SettingsRow icon={ScrollText} tone="gray" label="Conditions d'utilisation" onClick={() => navigate("/cgu")} />
                      <SettingsRow icon={Shield} tone="gray" label="Confidentialité" onClick={() => navigate("/confidentialite")} />
                      <SettingsRow icon={Mail} tone="gray" label="Contacter le support" onClick={() => navigate("/contact")} />
                      <SettingsRow icon={Info} tone="gray" label="Version" description="AutoRA · 2026.05" noChevron />
                    </SettingsSection>
                  </div>

                  {/* Zone danger */}
                  <div className={activeCategory !== "danger" ? "md:hidden" : ""}>
                    <SettingsSection title="Zone danger">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <div>
                            <SettingsRow
                              icon={Trash2}
                              tone="destructive"
                              label={t("profile.deleteAccount")}
                              description={t("profile.deleteDesc")}
                              destructive
                              onClick={() => {}}
                            />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("profile.deleteConfirmTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("profile.deleteConfirmDesc")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("profile.deleteCancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  toast.info(t("profile.deleteProgress"));
                                  const { error } = await supabase.functions.invoke("delete-account");
                                  if (error) throw error;
                                  toast.success(t("profile.deleteSuccess"));
                                  await supabase.auth.signOut();
                                  navigate("/");
                                } catch {
                                  toast.error(t("profile.deleteError"));
                                }
                              }}
                            >
                              {t("profile.deleteConfirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <SettingsRow icon={LogOut} tone="destructive" label={t("nav.logout")} destructive onClick={handleSignOut} />
                    </SettingsSection>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ChangePasswordModal open={pwdModalOpen} onOpenChange={setPwdModalOpen} email={user?.email ?? ""} />

      <Footer />
    </div>
  );
}
