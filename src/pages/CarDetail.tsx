import { useParams, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import {  useState, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import {
  Heart,
  Share2,
  MapPin,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import FullscreenGallery from "@/components/cars/FullscreenGallery";
import { Header, Footer } from "@/shared/components";
import { CarCard, type Car, vehicleQueries } from "@/features/listings";
import { Button } from "@/components/ui/button";
import { getCarByIdFromDb, formatPrice, formatMileage, getSellerContact, getSellerDisplay } from "@/utils/carUtils";
import { useFavorites } from "@/features/favorites";
import { useAuthPrompt } from "@/features/auth";

import { useToast } from "@/hooks/use-toast";
import { useTrackView } from "@/hooks/useTrackView";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent, EVENTS } from "@/lib/analytics";
import TransparencyChecklist from "@/components/TransparencyChecklist";
import LezWidget from "@/components/LezWidget";
import SellerBadge from "@/components/SellerBadge";
import ReviewsSection from "@/components/ReviewsSection";
import BentoSpecs from "@/components/BentoSpecs";
import EquipmentSection from "@/components/EquipmentSection";
import RichDescription from "@/components/RichDescription";
import _AutoraTransparency from "@/components/AutoraTransparency";
import SEOHead from "@/components/SEOHead";
import { vehicleSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import ReportAdModal from "@/components/ReportAdModal";
import ScrollReveal from "@/components/ScrollReveal";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { useLanguage } from "@/contexts/LanguageContext";
const VehicleTcoSection = lazy(() => import("@/features/tco/components/VehicleTcoSection"));
const FiscalAdvisorCard = lazy(() => import("@/components/FiscalAdvisorCard"));

/** Stagger variants for sections */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const CarDetail = () => {
  const { id: idOrSlug } = useParams<{ id: string }>();
  // Support both raw UUIDs and SEO slugs ending with the UUID
  const id = idOrSlug
    ? (idOrSlug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)?.[0] ?? idOrSlug)
    : undefined;
  const navigate = useNavigate();
  const vehicleHref = useLocalizedVehicleHref();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { requireAuth } = useAuthPrompt();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [car, setCar] = useState<Car | null>(null);
  const [dbListing, setDbListing] = useState<Tables<"car_listings_public"> | null>(null);
  const [sellerContact, setSellerContact] = useState<{
    contact_name: string;
    contact_phone: string | null;
    contact_email: string;
    user_id: string;
  } | null>(null);
  const [sellerDisplay, setSellerDisplay] = useState<{
    user_id: string;
    display_name: string | null;
    garage_name: string | null;
    user_type: string | null;
    avatar_url?: string | null;
    vitrine_slug?: string | null;
    vitrine_published?: boolean | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [currentUser, setCurrentUser] = useState<string | undefined>(undefined);
  const [mobileTab, setMobileTab] = useState(0);
  const isAdmin = useIsAdmin(currentUser);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user?.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAdminDelete = async () => {
    if (!id || !isAdmin) return;
    const confirmed = window.confirm("⚠️ Supprimer définitivement cette annonce ? Cette action est irréversible.");
    if (!confirmed) return;

    const { error } = await supabase.from("car_listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'annonce", variant: "destructive" });
    } else {
      toast({ title: "Annonce supprimée", description: "L'annonce a été supprimée avec succès" });
      navigate("/");
    }
  };

  useTrackView(id);

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const dbCar = await getCarByIdFromDb(id);
      if (dbCar) {
        setCar(dbCar);
        trackEvent(EVENTS.VEHICLE_VIEWED, {
          car_id: dbCar.id,
          brand: dbCar.brand,
          model: dbCar.model,
          price: dbCar.price,
        });
        const { data } = await supabase
          .from('car_listings_public')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (data) {
          setDbListing(data);
        }

        const [contact, display] = await Promise.all([
          getSellerContact(id),
          getSellerDisplay(id),
        ]);
        if (contact) setSellerContact(contact);
        if (display) setSellerDisplay(display);

        // Fetch similar listings: same brand + body type, price ±30%, max 3
        const similar = await vehicleQueries.getSimilar(
          { id: dbCar.id, brand: dbCar.brand, bodyType: data?.body_type, price: dbCar.price },
          3,
        );
        setRelatedCars(similar);
      }
      
      setIsLoading(false);
    };

    fetchCar();
  }, [id]);

  

  if (isLoading) {
    return (
      <div className="page-gradient">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-24 sm:pb-12">
          {/* Mobile skeleton */}
          <div className="lg:hidden space-y-4">
            {/* Gallery */}
            <div className="aspect-[4/3] rounded-2xl skeleton-shimmer" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-2 w-2 rounded-full skeleton-shimmer" />)}
            </div>
            {/* Title + price */}
            <div className="space-y-2">
              <div className="h-7 w-3/4 rounded-lg skeleton-shimmer" />
              <div className="h-5 w-1/2 rounded-lg skeleton-shimmer" />
              <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
            </div>
            {/* Spec chips */}
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 rounded-full skeleton-shimmer" />
              ))}
            </div>
            {/* Tab bar */}
            <div className="flex gap-2 border-b border-border/40 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-16 rounded-lg skeleton-shimmer" />
              ))}
            </div>
            {/* Tab content */}
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>

          {/* Desktop skeleton */}
          <div className="hidden lg:grid grid-cols-3 gap-8">
            {/* Left — gallery + details */}
            <div className="col-span-2 space-y-6">
              <div className="aspect-video rounded-3xl skeleton-shimmer" />
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="aspect-[4/3] rounded-xl skeleton-shimmer" />
                ))}
              </div>
              {/* BentoSpecs placeholder */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
                ))}
              </div>
              {/* Description */}
              <div className="space-y-2">
                <div className="h-5 w-40 rounded-lg skeleton-shimmer" />
                <div className="h-4 w-full rounded skeleton-shimmer" />
                <div className="h-4 w-5/6 rounded skeleton-shimmer" />
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
              </div>
              {/* Transparency */}
              <div className="h-32 rounded-2xl skeleton-shimmer" />
            </div>

            {/* Right — sticky sidebar */}
            <div className="space-y-4">
              <div className="h-7 w-3/4 rounded-lg skeleton-shimmer" />
              <div className="h-5 w-1/2 rounded-lg skeleton-shimmer" />
              <div className="h-10 w-36 rounded-lg skeleton-shimmer" />
              <div className="h-px w-full bg-border/40" />
              <div className="space-y-3">
                <div className="h-12 rounded-xl skeleton-shimmer" />
                <div className="h-12 rounded-xl skeleton-shimmer" />
                <div className="h-12 rounded-xl skeleton-shimmer" />
              </div>
              <div className="h-px w-full bg-border/40" />
              {/* Seller badge */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full skeleton-shimmer" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded skeleton-shimmer" />
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="page-gradient">
        <Header />
        <main className="container mx-auto px-6 py-32 text-center">
          <motion.div {...fadeUp(0)}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Véhicule non trouvé
            </h1>
            <p className="text-muted-foreground mb-8">
              Ce véhicule n'existe pas ou a été retiré de la vente.
            </p>
            <Button onClick={() => navigate("/")} className="btn-primary-gradient">
              Retour aux annonces
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const validPhotos = (dbListing?.photos ?? []).filter((p): p is string => !!p && p.length > 0);
  const images: string[] = validPhotos.length > 0 ? validPhotos : [car.image];

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${car.brand} ${car.model}`,
        text: `Découvrez cette ${car.brand} ${car.model} à ${formatPrice(car.price)}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié !",
        description: "Le lien a été copié dans le presse-papier",
      });
    }
  };

  const handleContact = async (method: string) => {
    trackEvent(EVENTS.CONTACT_SELLER_CLICKED, {
      method,
      car_id: car?.id ?? null,
      brand: car?.brand ?? null,
    });
    // Gate all contact methods behind auth (positive friction modal for guests).
    const reason = method === "Message" ? "message" : "contact";
    if (!requireAuth({ reason })) return;

    if (sellerContact) {
      if (method === "Email" && sellerContact.contact_email) {
        window.location.href = `mailto:${sellerContact.contact_email}?subject=Intéressé par votre ${car.brand} ${car.model}`;
        return;
      }
      if (method === "Appeler" && sellerContact.contact_phone) {
        window.location.href = `tel:${sellerContact.contact_phone}`;
        return;
      }
      if (method === "WhatsApp" && sellerContact.contact_phone) {
        const phone = sellerContact.contact_phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=Bonjour, je suis intéressé par votre ${car.brand} ${car.model}`, '_blank');
        return;
      }
      if (method === "Message") {
        await startConversation();
        return;
      }
    } else if (method === "Message" && dbListing) {
      await startConversation();
      return;
    }

    toast({
      title: "Coordonnées indisponibles",
      description: "Impossible de récupérer les coordonnées du vendeur pour le moment.",
    });
  };


  const startConversation = async () => {
    if (!dbListing) {
      toast({
        title: "Indisponible",
        description: "La messagerie n'est disponible que pour les annonces de particuliers",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Should be intercepted earlier by requireAuth — keep modal fallback.
      requireAuth({ reason: "message" });
      return;
    }

    const currentUserId = session.user.id;


    const contact = await getSellerContact(id ?? '');
    if (!contact) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations du vendeur",
        variant: "destructive",
      });
      return;
    }

    if (currentUserId === contact.user_id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous envoyer un message",
      });
      return;
    }

    try {
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('car_listing_id', dbListing.id ?? '')
        .eq('buyer_id', currentUserId)
        .eq('seller_id', contact.user_id)
        .maybeSingle();

      if (existingConvo) {
        navigate('/messages');
        return;
      }

      const { error } = await supabase
        .from('conversations')
        .insert({
          car_listing_id: dbListing.id,
          buyer_id: currentUserId,
          seller_id: contact.user_id,
          car_brand: car.brand,
          car_model: car.model,
          car_image: car.image
        });

      if (error) throw error;

      toast({
        title: "Conversation créée",
        description: "Vous pouvez maintenant envoyer un message",
      });
      
      navigate('/messages');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    }
  };

  const description = dbListing?.description ?? "";

  // Public seller name: garage_name for Pro, display_name for private,
  // fallback to authenticated contact_name then a generic label.
  const isProSeller = (sellerDisplay?.user_type ?? dbListing?.seller_type) === "professionnel";
  const sellerName =
    (isProSeller ? sellerDisplay?.garage_name : sellerDisplay?.display_name) ||
    sellerDisplay?.display_name ||
    sellerContact?.contact_name ||
    "Vendeur vérifié";

  return (
    <div className="page-gradient">
      <SEOHead 
        title={`${car.brand} ${car.model} ${car.year} — ${formatPrice(car.price)}`}
        description={`${car.brand} ${car.model} ${car.year} • ${formatPrice(car.price)} • ${formatMileage(car.mileage)} km • ${car.fuelType} • ${car.location}. Annonce vérifiée sur AutoRA.be.`}
        image={car.image}
        url={`https://autora.be/car/${id}`}
        type="product"
        jsonLd={[
          vehicleSchema({
            id: id!,
            brand: car.brand,
            model: car.model,
            year: car.year,
            mileage: car.mileage,
            fuelType: car.fuelType,
            transmission: car.transmission,
            euroNorm: car.euroNorm,
            price: car.price,
            image: car.image,
            location: car.location,
            description,
            sellerName,
            sellerType: car.sellerType,
          }),
          breadcrumbSchema([
            { name: "AutoRA", url: "https://autora.be" },
            { name: car.brand, url: `https://autora.be/?brand=${car.brand}` },
            { name: `${car.brand} ${car.model}`, url: `https://autora.be/car/${id}` },
          ]),
        ]}
      />
      <Header />
      <main className="pt-16 sm:pt-24 pb-28 lg:pb-20">

        <div className="container mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-6">
              {/* Main Image Gallery with swipe */}
              <motion.div {...fadeUp(0.05)} className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border/20 bg-card shadow-[var(--shadow-card)]">
                <div
                  className="relative aspect-[16/10] sm:aspect-video cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl sm:rounded-3xl"
                  onClick={() => setFullscreenOpen(true)}
                  role="region"
                  aria-roledescription="carousel"
                  aria-label={`Galerie photos ${car.brand} ${car.model}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (images.length <= 1) return;
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                    } else if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFullscreenOpen(true);
                    }
                  }}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.img
                      key={currentImageIndex}
                      src={images[currentImageIndex]}
                      alt={`${car.brand} ${car.model} — photo ${currentImageIndex + 1} sur ${images.length}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.12}
                      onDragEnd={(_: unknown, info: PanInfo) => {
                        if (info.offset.x > 50) setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                        else if (info.offset.x < -50) setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                      }}
                      onClick={(e) => { e.stopPropagation(); setFullscreenOpen(true); }}
                    />
                  </AnimatePresence>

                  {/* Fullscreen hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                      Plein écran
                    </span>
                  </div>

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Photo précédente"
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center hover:bg-background/80 transition-all shadow-lg active:scale-90 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Photo suivante"
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center hover:bg-background/80 transition-all shadow-lg active:scale-90 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <ChevronRight className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </>
                  )}

                  {/* Discrete counter indicator (top right) */}
                  {images.length > 1 && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-[11px] font-medium tabular-nums tracking-wide pointer-events-none"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <span className="sr-only">Photo </span>{currentImageIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex gap-2">
                    {car.isLezCompatible && (
                      <span className="lez-badge shadow-lg">
                        <Shield className="w-3 h-3" />
                        LEZ OK
                      </span>
                    )}
                    {car.hasCarPass && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-background/90 backdrop-blur-md text-foreground shadow-lg">
                        <Shield className="w-4 h-4 text-primary" />
                        Car-Pass
                      </span>
                    )}
                  </div>
                </div>

              </motion.div>

              {/* Fullscreen Gallery Overlay */}
              <AnimatePresence>
                {fullscreenOpen && (
                  <FullscreenGallery
                    images={images as string[]}
                    initialIndex={currentImageIndex}
                    alt={`${car.brand} ${car.model}`}
                    onClose={() => setFullscreenOpen(false)}
                  />
                )}
              </AnimatePresence>

              {/* Mobile-only: Title, Price & CTA — refined */}
              <motion.div {...fadeUp(0.1)} className="lg:hidden rounded-2xl border border-border/20 bg-card p-4 space-y-3 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
                      {car.brand} {car.model}
                    </h1>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{car.location}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleFavorite(car.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation ${
                        isFavorite(car.id)
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(car.id) ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground transition-colors active:scale-90 touch-manipulation"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {formatPrice(car.price)}
                </div>

                <SellerBadge
                  sellerType={dbListing?.seller_type}
                  sellerName={sellerName}
                  tvaNumber={undefined}
                  sellerId={sellerContact?.user_id}
                />

                {isAdmin && (
                  <Button onClick={handleAdminDelete} variant="destructive" className="w-full h-11 mt-2">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer (Admin)
                  </Button>
                )}
              </motion.div>

              {/* Mobile floating contact bar — luxe bottom bar */}
              <div className="lg:hidden fixed bottom-[68px] left-0 right-0 z-50 px-3 pb-1 safe-bottom">
                <motion.div
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/20 shadow-2xl"
                >
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground active:scale-90 transition-transform touch-manipulation"
                    aria-label="Partager"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleFavorite(car.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform touch-manipulation ${
                      isFavorite(car.id)
                        ? "bg-red-500 text-white"
                        : "bg-secondary/60 text-muted-foreground"
                    }`}
                    aria-label="Favori"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(car.id) ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => handleContact("Message")}
                    className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 touch-manipulation"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter
                  </button>
                </motion.div>
              </div>

              {/* Mobile swipeable tabs for specs */}
              {isMobile ? (
                <div className="space-y-3">
                  {/* Tab bar — refined pills */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide p-1 bg-secondary/40 rounded-2xl">
                    {["Specs", "Confiance", "Coûts", "Description"].map((tab, i) => (
                      <button
                        key={tab}
                        onClick={() => setMobileTab(i)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                          mobileTab === i
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab content with swipe */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mobileTab}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.2 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.15}
                      onDragEnd={(_: unknown, info: PanInfo) => {
                        if (info.offset.x < -60 && mobileTab < 3) setMobileTab(mobileTab + 1);
                        else if (info.offset.x > 60 && mobileTab > 0) setMobileTab(mobileTab - 1);
                      }}
                    >
                      {mobileTab === 0 && (
                        <div className="space-y-4">
                          <BentoSpecs
                            year={car.year} mileage={car.mileage} fuelType={car.fuelType}
                            transmission={car.transmission} euroNorm={car.euroNorm} location={car.location}
                            power={dbListing?.power} color={dbListing?.color}
                            bodyType={dbListing?.body_type} doors={dbListing?.doors}
                            firstRegistration={dbListing?.first_registration}
                          />
                          <EquipmentSection features={dbListing?.features} />
                        </div>
                      )}
                      {mobileTab === 1 && (
                        <div className="space-y-4">
                          <TransparencyChecklist
                            carPassVerified={dbListing?.car_pass_verified}
                            ctValid={dbListing?.ct_valid}
                            maintenanceBookComplete={dbListing?.maintenance_book_complete}
                          />
                          <LezWidget euroNorm={car.euroNorm} fuelType={car.fuelType} />
                        </div>
                      )}
                      {mobileTab === 2 && (
                        <div className="space-y-4">
                          <Suspense fallback={<div className="h-20 rounded-2xl skeleton-shimmer" />}>
                            <VehicleTcoSection
                              price={car.price} fuelType={car.fuelType}
                              year={car.year} mileage={car.mileage} power={dbListing?.power}
                            />
                          </Suspense>
                          <Suspense fallback={<div className="h-20 rounded-2xl skeleton-shimmer" />}>
                            <FiscalAdvisorCard
                              vehicle={{ brand: car.brand, model: car.model, year: car.year, fuelType: car.fuelType, power: dbListing?.power, euroNorm: car.euroNorm }}
                            />
                          </Suspense>
                        </div>
                      )}
                      {mobileTab === 3 && (
                        <div className="space-y-4">
                          <RichDescription description={description} compact />
                          <ReviewsSection carListingId={id!} sellerId={sellerContact?.user_id} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                /* Desktop: all sections stacked */
                <div className="space-y-6">
                  <ScrollReveal delay={0.05}>
                    <Suspense fallback={<div className="h-20 rounded-2xl skeleton-shimmer" />}>
                      <VehicleTcoSection price={car.price} fuelType={car.fuelType} year={car.year} mileage={car.mileage} power={dbListing?.power} />
                    </Suspense>
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <BentoSpecs year={car.year} mileage={car.mileage} fuelType={car.fuelType} transmission={car.transmission} euroNorm={car.euroNorm} location={car.location} power={dbListing?.power} color={dbListing?.color} bodyType={dbListing?.body_type} doors={dbListing?.doors} firstRegistration={dbListing?.first_registration} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <EquipmentSection features={dbListing?.features} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <TransparencyChecklist carPassVerified={dbListing?.car_pass_verified} ctValid={dbListing?.ct_valid} maintenanceBookComplete={dbListing?.maintenance_book_complete} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <LezWidget euroNorm={car.euroNorm} fuelType={car.fuelType} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <Suspense fallback={<div className="h-20 rounded-2xl skeleton-shimmer" />}>
                      <FiscalAdvisorCard
                        vehicle={{ brand: car.brand, model: car.model, year: car.year, fuelType: car.fuelType, power: dbListing?.power, euroNorm: car.euroNorm }}
                      />
                    </Suspense>
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <RichDescription description={description} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <ReviewsSection carListingId={id!} sellerId={sellerContact?.user_id} />
                  </ScrollReveal>
                </div>
              )}
            </div>

            {/* Right Column - Price & Contact (desktop only) */}
            <div className="hidden lg:block">
              <motion.div
                {...fadeUp(0.15)}
                className="glass-card p-6 sm:p-7 sticky top-24 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
                      {car.brand} {car.model}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1.5 text-sm">
                      <MapPin className="w-4 h-4" />
                      {car.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(car.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                        isFavorite(car.id)
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-secondary text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite(car.id) ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-90"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Price — larger, bolder */}
                <div className="text-4xl font-display font-extrabold text-foreground">
                  {formatPrice(car.price)}
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Contact buttons */}
                <div className="space-y-3">
                  {dbListing && (
                    <Button
                      onClick={() => handleContact("Message")}
                      className="w-full h-12 btn-primary-gradient text-base"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Envoyer un message
                    </Button>
                  )}
                  <Button
                    onClick={() => handleContact("Appeler")}
                    variant={dbListing ? "outline" : "default"}
                    className={`w-full h-12 ${!dbListing ? 'btn-primary-gradient' : ''}`}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Appeler le vendeur
                  </Button>
                  <Button
                    onClick={() => handleContact("Email")}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Envoyer un email
                  </Button>
                  <Button
                    onClick={() => handleContact("WhatsApp")}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Seller Badge */}
                <SellerBadge
                  sellerType={dbListing?.seller_type}
                  sellerName={sellerName}
                  tvaNumber={undefined}
                />

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  AutoRA n'est pas intermédiaire de paiement. Ne payez jamais avant d'avoir vu le véhicule.
                </p>

                {/* Report Ad */}
                <div className="pt-2 border-t border-border flex justify-center">
                  <ReportAdModal
                    carListingId={id!}
                    carBrand={car.brand}
                    carModel={car.model}
                  />
                </div>

                {/* Admin Delete */}
                {isAdmin && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      onClick={handleAdminDelete}
                      variant="destructive"
                      className="w-full h-10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer cette annonce (Admin)
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Related cars section removed per product decision */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
