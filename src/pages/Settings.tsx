import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Bell, Loader2, Cookie, Shield, BarChart3, Sparkles, User, Camera, Smartphone, Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  consented: boolean;
  timestamp?: number;
}

const COOKIE_STORAGE_KEY = "autora_cookie_preferences";

function CookiePreferencesCard() {
  const { t } = useLanguage();
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    personalization: false,
    consented: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (stored) {
      setCookiePrefs(JSON.parse(stored));
    }
  }, []);

  const updateCookiePreference = (key: keyof CookiePreferences, value: boolean) => {
    const updated = { ...cookiePrefs, [key]: value, timestamp: Date.now() };
    setCookiePrefs(updated);
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Préférences cookies mises à jour");
  };

  const resetCookieConsent = () => {
    localStorage.removeItem(COOKIE_STORAGE_KEY);
    window.location.reload();
  };

  const cookieCategories = [
    {
      id: "essential" as const,
      icon: Shield,
      title: "Cookies essentiels",
      description: "Nécessaires au fonctionnement du site",
      required: true,
    },
    {
      id: "analytics" as const,
      icon: BarChart3,
      title: "Cookies analytiques",
      description: "Nous aident à améliorer le site",
      required: false,
    },
    {
      id: "personalization" as const,
      icon: Sparkles,
      title: "Cookies de personnalisation",
      description: "Mémorisent vos préférences",
      required: false,
    },
  ];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Préférences cookies
        </CardTitle>
        <CardDescription>
          Gérez vos préférences de cookies conformément au RGPD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cookieCategories.map((category) => (
          <div key={category.id} className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <category.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  {category.title}
                  {category.required && (
                    <span className="text-xs text-primary font-normal">(requis)</span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </div>
            <Switch
              checked={cookiePrefs[category.id]}
              onCheckedChange={(checked) => updateCookiePreference(category.id, checked)}
              disabled={category.required}
            />
          </div>
        ))}

        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={resetCookieConsent}
            className="w-full"
          >
            Réinitialiser le consentement cookies
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            La page sera rechargée pour afficher la bannière de consentement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PushNotificationsCard() {
  const { t } = useLanguage();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notifications push
          </CardTitle>
          <CardDescription>
            Les notifications push ne sont pas supportées par votre navigateur
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Notifications push
        </CardTitle>
        <CardDescription>
          Recevez des notifications instantanées pour les nouveaux messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">
              Notifications push
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? "Vous recevrez des notifications sur cet appareil" 
                : "Activez pour recevoir des notifications en temps réel"}
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={(checked) => {
              if (checked) {
                subscribe();
              } else {
                unsubscribe();
              }
            }}
            disabled={isLoading}
          />
        </div>

        {permission === 'denied' && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
          </div>
        )}

        {isSubscribed && (
          <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications actives sur cet appareil
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      
      // Fetch user preferences
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
      
      // Fetch user profile
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id, 
          avatar_url: publicUrl 
        }, { onConflict: "user_id" });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Avatar mis à jour");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors du téléchargement de l'avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id, 
          display_name: displayName.trim() 
        }, { onConflict: "user_id" });

      if (error) throw error;
      
      toast.success("Profil mis à jour");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsSaving(true);
    setEmailNotifications(enabled);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id, 
          email_notifications_enabled: enabled 
        }, { 
          onConflict: "user_id" 
        });

      if (error) throw error;
      
      toast.success(enabled 
        ? t("settings.emailEnabled")
        : t("settings.emailDisabled")
      );
    } catch (error) {
      console.error("Error updating preferences:", error);
      setEmailNotifications(!enabled); // Revert on error
      toast.error(t("settings.errorUpdate"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-gradient flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("settings.back")}
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t("settings.title")}</h1>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil
            </CardTitle>
            <CardDescription>
              Gérez votre nom d'affichage et votre avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-2xl">
                    {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Photo de profil</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG ou GIF. Max 2 Mo.
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Nom d'affichage</Label>
              <div className="flex gap-2">
                <Input
                  id="display-name"
                  placeholder="Votre nom"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("settings.notifications")}
            </CardTitle>
            <CardDescription>
              {t("settings.notificationsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base">
                  {t("settings.emailNotifications")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.emailNotificationsDesc")}
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={handleToggleNotifications}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications Card */}
        <PushNotificationsCard />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("settings.account")}</CardTitle>
            <CardDescription>
              {t("settings.accountDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("settings.email")}</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* RGPD / Data Privacy Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Données personnelles (RGPD)
            </CardTitle>
            <CardDescription>
              Conformément au RGPD, vous pouvez exporter ou supprimer vos données à tout moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exporter mes données
                </Label>
                <p className="text-sm text-muted-foreground">
                  Téléchargez une copie de toutes vos données personnelles (JSON)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    toast.info("Préparation de l'export...");
                    const { data, error } = await supabase.functions.invoke("export-user-data");
                    if (error) throw error;
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
              >
                Exporter
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Supprimer mon compte
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Supprimer</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Toutes vos données seront supprimées :
                        annonces, messages, favoris, alertes et profil. Vous ne pourrez plus
                        récupérer ces informations.
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
              </div>
            </div>
          </CardContent>
        </Card>

        <CookiePreferencesCard />
      </main>

      <Footer />
    </div>
  );
}