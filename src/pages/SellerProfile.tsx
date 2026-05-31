/**
 * Public Seller Profile page — Vinted-inspired UX with premium automotive UI
 * Route: /seller/:userId
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { localBusinessSchema } from "@/lib/seoSchemas";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {    Star, MapPin, Phone, Calendar, ArrowLeft, Car, MessageSquare, Info, Shield, Clock, Heart, Navigation, Pencil, ImagePlus, Wrench, FileText, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr, nl, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useFavoriteCounts } from "@/features/favorites/hooks/useFavoriteCounts";

/* ---------- types ---------- */
interface SellerProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  garage_name: string | null;
  phone: string | null;
  postal_code: string | null;
  created_at: string;
  cover_image_url: string | null;
  opening_hours: string | null;
  services: string[] | null;
  presentation: string | null;
}


interface SellerListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  photos: string[] | null;
  location: string | null;
  created_at: string;
}

interface SellerReview {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name?: string;
}

/* ---------- component ---------- */
const SellerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const vehicleHref = useLocalizedVehicleHref();
  const { language } = useLanguage();
  const { toast } = useToast();
  const dateLocale = language === "fr" ? fr : language === "nl" ? nl : enUS;

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const sellerListingIds = useMemo(() => listings.map(l => l.id), [listings]);
  const favCounts = useFavoriteCounts(sellerListingIds);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUserId(session?.user?.id ?? null));
  }, []);

  const isOwnProfile = currentUserId && userId && currentUserId === userId;

  /* Fetch all data in parallel */
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);

      const [profileRes, _listingsRes, _reviewsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url, garage_name, phone, postal_code, created_at, cover_image_url, opening_hours, services, presentation").eq("user_id", userId).single(),
        supabase.from("car_listings_public").select("id, brand, model, year, price, mileage, fuel_type, transmission, photos, location, created_at").eq("seller_type", "professionnel").order("created_at", { ascending: false }),
        supabase.from("reviews").select("id, user_id, rating, comment, created_at"),
      ]);

      if (profileRes.data) setProfile(profileRes.data as SellerProfile);


      // Use the secure RPC function to get seller listings without exposing sensitive columns
      const { data: sellerListings } = await supabase
        .rpc("get_seller_public_listings", { _seller_id: userId });

      if (sellerListings) setListings(sellerListings as SellerListing[]);

      // Filter reviews: get all car_listing_ids for this seller, then filter reviews
      if (sellerListings && sellerListings.length > 0) {
        const listingIds = sellerListings.map(l => l.id);
        const { data: sellerReviews } = await supabase
          .from("reviews")
          .select("id, user_id, rating, comment, created_at")
          .in("car_listing_id", listingIds)
          .order("created_at", { ascending: false });

        if (sellerReviews) {
          // Fetch reviewer names
          const reviewerIds = [...new Set(sellerReviews.map(r => r.user_id))];
          const { data: reviewerProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", reviewerIds);

          const nameMap = new Map(reviewerProfiles?.map(p => [p.user_id, p.display_name]) || []);
          setReviews(sellerReviews.map(r => ({ ...r, reviewer_name: nameMap.get(r.user_id) || undefined })));
        }
      }

      setLoading(false);
    };
    load();
  }, [userId]);

  /* Computed stats */
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy", { locale: dateLocale })
    : "";

  const displayName = profile?.garage_name || profile?.display_name || "Vendeur";

  const [contacting, setContacting] = useState(false);

  const handleContact = useCallback(async () => {
    if (!userId) return;
    setContacting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: language === "nl" ? "Log in om te contacteren" : "Connectez-vous pour contacter", description: language === "nl" ? "U moet ingelogd zijn" : "Vous devez être connecté" });
      setContacting(false);
      navigate("/auth");
      return;
    }

    if (session.user.id === userId) {
      toast({ title: language === "nl" ? "Dat bent u zelf" : "C'est votre propre profil" });
      setContacting(false);
      return;
    }

    // Check if conversation already exists with this seller (without a specific listing)
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("buyer_id", session.user.id)
      .eq("seller_id", userId)
      .maybeSingle();

    if (existing) {
      navigate(`/messages?conversation=${existing.id}`);
      setContacting(false);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        buyer_id: session.user.id,
        seller_id: userId,
        car_brand: displayName,
        car_model: language === "nl" ? "Profiel" : "Profil",
      })
      .select("id")
      .single();

    if (error || !newConv) {
      toast({ title: language === "nl" ? "Fout" : "Erreur", description: language === "nl" ? "Kan gesprek niet aanmaken" : "Impossible de créer la conversation", variant: "destructive" });
      setContacting(false);
      return;
    }

    navigate(`/messages?conversation=${newConv.id}`);
    setContacting(false);
  }, [userId, navigate, toast, language, displayName]);

  if (loading) return <SellerProfileSkeleton />;
  if (!profile) {
    return (
      <div className="page-gradient min-h-screen">
        <Header />
        <main className="pt-24 pb-32 container mx-auto px-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Vendeur introuvable</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-gradient min-h-screen">
      <SEOHead
        title={`${displayName} | AutoRA`}
        description={`Profil vendeur de ${displayName} sur AutoRA. Consultez les annonces, avis et coordonnées.`}
        jsonLd={localBusinessSchema}
      />
      <Header />

      <main className="pt-20 pb-32">
        {/* Back button */}
        <div className="container mx-auto px-6 sm:px-8 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "nl" ? "Terug" : "Retour"}
          </button>
        </div>

        {/* ── Profile Header Card (with cover image) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="container mx-auto px-6 sm:px-8 mb-8"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
            {/* Cover image banner */}
            <div className="relative h-32 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-background">
              {profile.cover_image_url ? (
                <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
              {isOwnProfile && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/50 px-3 py-1.5 text-xs font-medium text-foreground shadow-md hover:bg-background transition-colors"
                >
                  <Pencil className="w-3 h-3" strokeWidth={2} />
                  {language === "nl" ? "Vitrine bewerken" : "Modifier ma vitrine"}
                </button>
              )}
            </div>

            <div className="relative px-6 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-16">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-card bg-secondary shadow-lg">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/[0.06]">
                        <span className="text-3xl font-serif font-light text-primary">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                    Pro
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-serif font-light text-foreground mb-2">
                    {displayName}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-border"}`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({reviews.length} {language === "nl" ? "beoordelingen" : "avis"})
                    </span>
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-sm text-muted-foreground">
                    {profile.postal_code && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50">
                        <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {profile.postal_code}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {language === "nl" ? "Lid sinds" : "Membre depuis"} {memberSince}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50">
                      <Car className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {listings.length} {language === "nl" ? "advertenties" : "annonces"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/15 text-primary">
                      <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {language === "nl" ? "Geverifieerd" : "Vérifié"}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-2">
                    <Button
                      onClick={handleContact}
                      disabled={contacting}
                      className="btn-primary-gradient rounded-xl px-6 py-3 h-auto text-sm font-semibold shadow-md"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      {contacting
                        ? (language === "nl" ? "Even geduld..." : "Chargement...")
                        : (language === "nl" ? "Contacteer verkoper" : "Contacter le vendeur")
                      }
                    </Button>
                    {(profile.postal_code || profile.garage_name) && (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl px-5 py-3 h-auto text-sm font-semibold border-border/60"
                      >
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([profile.garage_name, profile.postal_code, "Belgique"].filter(Boolean).join(" "))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          {language === "nl" ? "Route" : "Itinéraire"}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>


        {/* ── Tabs ── */}
        <div className="container mx-auto px-6 sm:px-8">
          <Tabs defaultValue="garage" className="w-full">
            <TabsList className="w-full max-w-lg mx-auto grid grid-cols-3 h-12 rounded-xl bg-secondary/60 border border-border/50 p-1 mb-8">
              <TabsTrigger
                value="garage"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
              >
                <Car className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                {language === "nl" ? "Garage" : "Mon Garage"}
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                {language === "nl" ? "Beoordelingen" : "Évaluations"}
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
              >
                <Info className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                {language === "nl" ? "Over" : "À propos"}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Mon Garage ── */}
            <TabsContent value="garage">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {listings.length === 0 ? (
                  <div className="text-center py-16">
                    <Car className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1} />
                    <p className="text-muted-foreground">
                      {language === "nl" ? "Geen actieve advertenties" : "Aucune annonce active"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {listings.map((listing, i) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.05 }}
                      >
                        <Link
                          to={vehicleHref(listing)}
                          className="group block rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                        >
                          {/* Image */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                            {listing.photos && listing.photos.length > 0 ? (
                              <img
                                src={listing.photos[0]}
                                alt={`${listing.brand} ${listing.model}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-10 h-10 text-muted-foreground/30" />
                              </div>
                            )}
                            {/* Price & fav count badge */}
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5">
                                <span className="text-sm font-semibold text-foreground">
                                  {listing.price.toLocaleString("fr-BE")} €
                                </span>
                              </div>
                              {favCounts[listing.id] > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 text-xs text-muted-foreground">
                                  <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                                  {favCounts[listing.id]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-4">
                            <h3 className="font-medium text-foreground text-[15px] mb-1 group-hover:text-primary transition-colors">
                              {listing.brand} {listing.model}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{listing.year}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span>{listing.mileage.toLocaleString("fr-BE")} km</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="capitalize">{listing.fuel_type}</span>
                            </div>
                            {listing.location && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" strokeWidth={1.5} />
                                {listing.location}
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* ── Tab: Évaluations ── */}
            <TabsContent value="reviews">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {reviews.length === 0 ? (
                  <div className="text-center py-16">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1} />
                    <p className="text-muted-foreground">
                      {language === "nl" ? "Nog geen beoordelingen" : "Aucune évaluation pour le moment"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {/* Summary card */}
                    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 text-center mb-8">
                      <div className="text-4xl font-serif font-light text-foreground mb-2">{avgRating.toFixed(1)}</div>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${star <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-border"}`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === "nl" ? `${reviews.length} beoordelingen` : `${reviews.length} évaluations`}
                      </p>
                    </div>

                    {/* Individual reviews */}
                    {reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className="rounded-xl border border-border/50 bg-card/60 p-5"
                      >
                        <div className="flex items-start gap-4">
                          {/* Reviewer avatar */}
                          <div className="w-10 h-10 rounded-full bg-primary/[0.06] border border-border/50 flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {(review.reviewer_name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {review.reviewer_name || (language === "nl" ? "Gebruiker" : "Utilisateur")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-border"}`}
                                  strokeWidth={1.5}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* ── Tab: À propos ── */}
            <TabsContent value="about">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                {/* Info card */}
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-8">
                  <h3 className="font-serif text-xl font-light text-foreground mb-6">
                    {language === "nl" ? "Over de verkoper" : "À propos du vendeur"}
                  </h3>

                  <div className="space-y-5">
                    {profile.garage_name && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/[0.06] border border-border/50 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            {language === "nl" ? "Garagenaam" : "Nom du garage"}
                          </p>
                          <p className="text-foreground font-medium">{profile.garage_name}</p>
                        </div>
                      </div>
                    )}

                    {profile.postal_code && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/[0.06] border border-border/50 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            {language === "nl" ? "Locatie" : "Localisation"}
                          </p>
                          <p className="text-foreground font-medium">{profile.postal_code}</p>
                        </div>
                      </div>
                    )}

                    {profile.phone && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/[0.06] border border-border/50 flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            {language === "nl" ? "Telefoon" : "Téléphone"}
                          </p>
                          <a href={`tel:${profile.phone}`} className="text-foreground font-medium hover:text-primary transition-colors">
                            {profile.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/[0.06] border border-border/50 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {language === "nl" ? "Lid sinds" : "Membre depuis"}
                        </p>
                        <p className="text-foreground font-medium">{memberSince}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-8">
                  <h3 className="font-serif text-lg font-light text-foreground mb-5">
                    {language === "nl" ? "Vertrouwensindicatoren" : "Indicateurs de confiance"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        icon: Shield,
                        label: language === "nl" ? "Geverifieerd profiel" : "Profil vérifié",
                        value: language === "nl" ? "Ja" : "Oui",
                      },
                      {
                        icon: Car,
                        label: language === "nl" ? "Actieve advertenties" : "Annonces actives",
                        value: String(listings.length),
                      },
                      {
                        icon: Star,
                        label: language === "nl" ? "Gemiddelde score" : "Note moyenne",
                        value: reviews.length > 0 ? `${avgRating.toFixed(1)}/5` : "—",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center text-center p-4 rounded-xl bg-background border border-border/50"
                      >
                        <item.icon className="w-5 h-5 text-primary mb-2" strokeWidth={1.5} />
                        <p className="text-lg font-medium text-foreground mb-0.5">{item.value}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* ---------- skeleton ---------- */
function SellerProfileSkeleton() {
  return (
    <div className="page-gradient min-h-screen">
      <Header />
      <main className="pt-20 pb-32">
        <div className="container mx-auto px-6 sm:px-8 mb-8">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Skeleton className="w-28 h-28 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-32 rounded-lg" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 sm:px-8">
          <Skeleton className="h-12 w-full max-w-lg mx-auto rounded-xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SellerProfile;
