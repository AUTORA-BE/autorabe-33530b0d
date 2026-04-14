import { useParams, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Shield,
  Leaf,
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
import { getCarByIdFromDb, formatPrice, formatMileage, getSellerContact } from "@/utils/carUtils";
import { useFavorites } from "@/features/favorites";
import { useToast } from "@/hooks/use-toast";
import { useTrackView } from "@/hooks/useTrackView";
import { supabase } from "@/integrations/supabase/client";
import TransparencyChecklist from "@/components/TransparencyChecklist";
import LezWidget from "@/components/LezWidget";
import SellerBadge from "@/components/SellerBadge";
import ReviewsSection from "@/components/ReviewsSection";
import BentoSpecs from "@/components/BentoSpecs";
import AutoraTransparency from "@/components/AutoraTransparency";
import SEOHead from "@/components/SEOHead";
import { vehicleSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import ReportAdModal from "@/components/ReportAdModal";
import ScrollReveal from "@/components/ScrollReveal";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMobile } from "@/hooks/use-mobile";
const VehicleTcoSection = lazy(() => import("@/features/tco/components/VehicleTcoSection"));
const BelgianTaxCalculator = lazy(() => import("@/components/BelgianTaxCalculator"));
const TaxChatModal = lazy(() => import("@/components/TaxChatModal"));

/** Stagger variants for sections */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
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
        
        const { data } = await supabase
          .from('car_listings_public')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (data) {
          setDbListing(data);
        }

        const contact = await getSellerContact(id);
        if (contact) {
          setSellerContact(contact);
        }

        // Fetch related vehicles via optimized API query
        const related = await vehicleQueries.getRelated(dbCar, 4);
        setRelatedCars(related);
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

  const images: string[] = (dbListing?.photos && dbListing.photos.length > 0)
    ? dbListing.photos
    : [
        car.image,
        car.image.replace("w=800", "w=801"),
        car.image.replace("w=800", "w=802"),
        car.image.replace("w=800", "w=803"),
      ];

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
      title: "Connexion requise",
      description: "Connectez-vous pour accéder aux coordonnées du vendeur",
    });
    navigate('/auth');
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
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour envoyer un message",
      });
      navigate('/auth');
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

  const description = dbListing?.description || `Superbe ${car.brand} ${car.model} de ${car.year} en excellent état.
Ce véhicule dispose d'une transmission ${car.transmission.toLowerCase()} et fonctionne au ${car.fuelType.toLowerCase()}. Avec seulement ${formatMileage(car.mileage)} au compteur, cette voiture est idéale pour les trajets quotidiens comme pour les longs voyages. Norme ${car.euroNorm}, compatible avec toutes les zones à faibles émissions de Belgique.`;

  const sellerName = sellerContact?.contact_name || "Vendeur vérifié";

  return (
    <div className="page-gradient">
      <SEOHead 
        title={`${car.brand} ${car.model} ${car.year} — ${formatPrice(car.price)}`}
        description={`${car.brand} ${car.model} ${car.year} • ${formatPrice(car.price)} • ${formatMileage(car.mileage)} km • ${car.fuelType} • ${car.location}. Annonce vérifiée sur AutoRa.be.`}
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
            { name: "AutoRa", url: "https://autora.be" },
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
                  className="relative aspect-[16/10] sm:aspect-video cursor-pointer group"
                  onClick={() => setFullscreenOpen(true)}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.img
                      key={currentImageIndex}
                      src={images[currentImageIndex]}
                      alt={`${car.brand} ${car.model}`}
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
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center hover:bg-background/80 transition-all shadow-lg active:scale-90 opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center hover:bg-background/80 transition-all shadow-lg active:scale-90 opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Elegant dot indicators instead of counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md">
                      {images.map((_: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                          className={`rounded-full transition-all duration-200 ${
                            idx === currentImageIndex
                              ? "w-5 h-1.5 bg-white"
                              : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                          }`}
                        />
                      ))}
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

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-16 sm:w-24 sm:h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          idx === currentImageIndex
                            ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                            : "border-transparent opacity-60 hover:opacity-100 hover:border-border"
                        }`}
                      >
                        <img src={img} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
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
                  {/* Tab bar */}
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide px-0.5 py-0.5 bg-secondary/50 rounded-xl">
                    {["Specs", "Confiance", "Coûts", "Description"].map((tab, i) => (
                      <button
                        key={tab}
                        onClick={() => setMobileTab(i)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                          mobileTab === i
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground"
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
                          />
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
                            <BelgianTaxCalculator
                              powerKw={dbListing?.power} fuelType={car.fuelType}
                              euroNorm={car.euroNorm} year={car.year}
                            />
                          </Suspense>
                          <div className="flex justify-center">
                            <Suspense fallback={null}>
                              <TaxChatModal vehicle={{ brand: car.brand, model: car.model, year: car.year, fuelType: car.fuelType, power: dbListing?.power, euroNorm: car.euroNorm }} />
                            </Suspense>
                          </div>
                        </div>
                      )}
                      {mobileTab === 3 && (
                        <div className="space-y-4">
                          <div className="glass-card p-5">
                            <h2 className="font-display text-lg font-bold text-foreground mb-3">Description</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">{description}</p>
                          </div>
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
                    <BentoSpecs year={car.year} mileage={car.mileage} fuelType={car.fuelType} transmission={car.transmission} euroNorm={car.euroNorm} location={car.location} power={dbListing?.power} color={dbListing?.color} bodyType={dbListing?.body_type} doors={dbListing?.doors} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <TransparencyChecklist carPassVerified={dbListing?.car_pass_verified} ctValid={dbListing?.ct_valid} maintenanceBookComplete={dbListing?.maintenance_book_complete} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <LezWidget euroNorm={car.euroNorm} fuelType={car.fuelType} />
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <Suspense fallback={<div className="h-20 rounded-2xl skeleton-shimmer" />}>
                      <BelgianTaxCalculator powerKw={dbListing?.power} fuelType={car.fuelType} euroNorm={car.euroNorm} year={car.year} />
                    </Suspense>
                    <div className="mt-3 flex justify-center">
                      <Suspense fallback={null}>
                        <TaxChatModal vehicle={{ brand: car.brand, model: car.model, year: car.year, fuelType: car.fuelType, power: dbListing?.power, euroNorm: car.euroNorm }} />
                      </Suspense>
                    </div>
                  </ScrollReveal>
                  <ScrollReveal delay={0.05}>
                    <div className="glass-card p-6 sm:p-7">
                      <h2 className="font-display text-xl font-bold text-foreground mb-4">Description</h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">{description}</p>
                    </div>
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
                  AutoRa n'est pas intermédiaire de paiement. Ne payez jamais avant d'avoir vu le véhicule.
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

          {/* Related Cars */}
          {relatedCars.length > 0 && (
            <ScrollReveal delay={0.1}>
              <section className="mt-12 sm:mt-16 lg:mt-20">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-1 h-8 rounded-full bg-primary" />
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    Véhicules similaires
                  </h2>
                </div>
                {/* Horizontal scroll on mobile, grid on desktop */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:snap-none lg:pb-0">
                  {relatedCars.map((relatedCar, i) => (
                    <div key={relatedCar.id} className="min-w-[200px] sm:min-w-[300px] lg:min-w-0 snap-start">
                      <ScrollReveal delay={i * 0.08}>
                        <CarCard
                          car={relatedCar}
                          isFavorite={isFavorite(relatedCar.id)}
                          onToggleFavorite={toggleFavorite}
                          onClick={(id) => navigate(`/car/${id}`)}
                        />
                      </ScrollReveal>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
