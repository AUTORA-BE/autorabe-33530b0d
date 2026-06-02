/**
 * Édition Vitrine — formulaire 2 colonnes avec live preview de la card vitrine.
 * Route: /dashboard/vitrine
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, ImagePlus, X, Eye, MessageSquare, Navigation, MapPin, Clock, Shield, Check, AlertCircle } from "lucide-react";

const EditVitrine = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [coverUrl, setCoverUrl] = useState("");
  const [presentation, setPresentation] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [hours, setHours] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [garageName, setGarageName] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  // Vitrine-specific fields
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [vitrinePhone, setVitrinePhone] = useState("");
  const [vitrineEmail, setVitrineEmail] = useState("");
  const [published, setPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, garage_name, postal_code, display_name, cover_image_url, opening_hours, services, presentation")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          setGarageName(data.garage_name);
          setPostalCode(data.postal_code);
          setDisplayName(data.display_name);
          setCoverUrl(data.cover_image_url ?? "");
          setHours(data.opening_hours ?? "");
          setServicesText((data.services ?? []).join("\n"));
          setPresentation(data.presentation ?? "");
        }
        setLoading(false);
      });
  }, [user]);

  const services = servicesText.split("\n").map(s => s.trim()).filter(Boolean);
  const name = garageName || displayName || (language === "nl" ? "Mijn garage" : "Mon garage");

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: language === "nl" ? "Bestand te groot (max 5MB)" : "Fichier trop volumineux (max 5MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `covers/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setCoverUrl(publicUrl);
    } catch {
      toast({ title: language === "nl" ? "Upload mislukt" : "Échec de l'envoi", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updates = {
      cover_image_url: coverUrl || null,
      opening_hours: hours || null,
      services,
      presentation: presentation || null,
    };
    const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: language === "nl" ? "Opslaan mislukt" : "Échec de l'enregistrement", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: language === "nl" ? "Vitrine bijgewerkt" : "Vitrine mise à jour" });
  };

  if (isLoading || !user || loading) return null;

  return (
    <div className="page-gradient min-h-screen">
      <SEOHead noIndex title="Édition Vitrine | AutoRA" />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <BackButton to="/dashboard" className="mb-4" />

          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-light text-foreground tracking-tight">
                {language === "nl" ? "Mijn vitrine bewerken" : "Édition de ma vitrine"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {language === "nl"
                  ? "Werk uw garage-vitrine bij en zie het resultaat in realtime."
                  : "Mettez à jour votre vitrine garage et visualisez le rendu en temps réel."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ── Colonne gauche : Formulaire ── */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 space-y-5">
                  {/* Cover */}
                  <div className="space-y-2">
                    <Label htmlFor="vitrine-cover" className="text-sm font-medium">
                      {language === "nl" ? "Omslagfoto" : "Photo de couverture"}
                    </Label>
                    <div className="relative h-32 rounded-xl overflow-hidden border border-border/50 bg-secondary">
                      {coverUrl ? (
                        <>
                          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCoverUrl("")}
                            aria-label={language === "nl" ? "Omslagfoto verwijderen" : "Supprimer la photo de couverture"}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 backdrop-blur-md border border-border flex items-center justify-center hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <ImagePlus className="w-8 h-8" strokeWidth={1.5} aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <label htmlFor="vitrine-cover" className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background rounded-md px-1 py-0.5">
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      {uploading
                        ? (language === "nl" ? "Bezig met uploaden..." : "Envoi en cours...")
                        : (language === "nl" ? "Foto uploaden (max 5MB)" : "Téléverser une photo (max 5MB)")}
                      <input id="vitrine-cover" type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} disabled={uploading} />
                    </label>
                  </div>

                  {/* Presentation */}
                  <div className="space-y-2">
                    <Label htmlFor="vitrine-presentation" className="text-sm font-medium">
                      {language === "nl" ? "Voorstelling" : "Présentation"}
                    </Label>
                    <Textarea
                      id="vitrine-presentation"
                      value={presentation}
                      onChange={(e) => setPresentation(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder={language === "nl" ? "Beschrijf uw garage..." : "Décrivez votre garage en quelques lignes..."}
                    />
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    <Label htmlFor="vitrine-services" className="text-sm font-medium">
                      {language === "nl" ? "Diensten (één per regel)" : "Services proposés (un par ligne)"}
                    </Label>
                    <Textarea
                      id="vitrine-services"
                      value={servicesText}
                      onChange={(e) => setServicesText(e.target.value)}
                      rows={5}
                      placeholder={language === "nl" ? "Onderhoud\nReparatie\nKeuring" : "Entretien\nRéparation\nContrôle technique"}
                    />
                  </div>

                  {/* Horaires */}
                  <div className="space-y-2">
                    <Label htmlFor="vitrine-hours" className="text-sm font-medium">
                      {language === "nl" ? "Openingsuren" : "Horaires d'ouverture"}
                    </Label>
                    <Textarea
                      id="vitrine-hours"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      rows={4}
                      placeholder={language === "nl"
                        ? "Ma - Vr: 9u - 18u\nZa: 9u - 12u\nZo: gesloten"
                        : "Lun - Ven: 9h - 18h\nSam: 9h - 12h\nDim: fermé"}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSave} disabled={saving || uploading} className="btn-primary-gradient rounded-xl px-6">
                    {saving
                      ? (language === "nl" ? "Opslaan..." : "Enregistrement...")
                      : (language === "nl" ? "Wijzigingen opslaan" : "Enregistrer les modifications")}
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to={`/seller/${user.id}`}>
                      <Eye className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      {language === "nl" ? "Publieke pagina bekijken" : "Voir la page publique"}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* ── Colonne droite : Live Preview ── */}
              <div className="lg:sticky lg:top-24 space-y-3 h-fit">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
                  {language === "nl" ? "Live preview" : "Aperçu en temps réel"}
                </div>

                {/* Vitrine card preview */}
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-elevated">
                  {/* Cover */}
                  <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-background">
                    {coverUrl ? (
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
                    )}
                    {/* Filtre sombre */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-black/40" />
                  </div>

                  {/* Body avec avatar overlap */}
                  <div className="relative px-6 pb-6 -mt-12">
                    <div className="flex items-end gap-4">
                      {/* Avatar overlap */}
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-card bg-secondary shadow-lg">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/[0.06]">
                              <span className="text-2xl font-light text-primary">
                                {name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                          Pro
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <h2 className="text-xl font-light text-foreground tracking-tight truncate">{name}</h2>
                        {postalCode && (
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" strokeWidth={1.5} /> {postalCode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button disabled className="btn-primary-gradient rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 opacity-90">
                        <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {language === "nl" ? "Contact" : "Contacter"}
                      </button>
                      <button disabled className="rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 border border-border/60 text-foreground">
                        <Navigation className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {language === "nl" ? "Route" : "Itinéraire"}
                      </button>
                    </div>

                    {/* Présentation */}
                    {presentation && (
                      <p className="mt-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                        {presentation}
                      </p>
                    )}

                    {/* Services */}
                    {services.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-medium mb-2 inline-flex items-center gap-1.5">
                          <Shield className="w-3 h-3" strokeWidth={1.8} />
                          {language === "nl" ? "Diensten" : "Services"}
                        </p>
                        <ul className="flex flex-wrap gap-1.5">
                          {services.slice(0, 8).map((s, i) => (
                            <li key={i} className="text-xs px-2.5 py-1 rounded-full bg-secondary/70 border border-border/40 text-foreground">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Horaires */}
                    {hours && (
                      <div className="mt-5 rounded-xl border border-border/40 bg-background/40 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1.5 inline-flex items-center gap-1.5">
                          <Clock className="w-3 h-3" strokeWidth={1.8} />
                          {language === "nl" ? "Openingsuren" : "Horaires"}
                        </p>
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">{hours}</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/80 px-1">
                  {language === "nl"
                    ? "Zo zien bezoekers uw vitrine."
                    : "Voici comment les visiteurs verront votre vitrine."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditVitrine;
