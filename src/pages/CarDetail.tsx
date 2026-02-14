import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Header, Footer } from "@/shared/components";
import { CarCard, type Car } from "@/features/listings";
import { Button } from "@/components/ui/button";
import { getCarByIdFromDb, getRelatedCarsFromList, formatPrice, formatMileage, getSellerContact } from "@/utils/carUtils";
import { useCarListings } from "@/features/listings";
import { useFavorites } from "@/hooks/useFavorites";
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
import ReportAdModal from "@/components/ReportAdModal";

const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [car, setCar] = useState<Car | null>(null);
  const [dbListing, setDbListing] = useState<any>(null);
  const [sellerContact, setSellerContact] = useState<{
    contact_name: string;
    contact_phone: string | null;
    contact_email: string;
    user_id: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { cars: allCars } = useCarListings();

  // Track view when page loads
  useTrackView(id);

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      // Fetch car from secure public view
      const dbCar = await getCarByIdFromDb(id);
      if (dbCar) {
        setCar(dbCar);
        
        // Fetch additional public listing data (without sensitive fields)
        const { data } = await supabase
          .from('car_listings_public')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (data) {
          setDbListing(data);
        }

        // Fetch seller contact info securely (only if user is authenticated)
        const contact = await getSellerContact(id);
        if (contact) {
          setSellerContact(contact);
        }
      }
      
      setIsLoading(false);
    };

    fetchCar();
  }, [id]);

  const relatedCars = car ? getRelatedCarsFromList(car, allCars, 4) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-32 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Véhicule non trouvé
          </h1>
          <p className="text-muted-foreground mb-8">
            Ce véhicule n'existe pas ou a été retiré de la vente.
          </p>
          <Button onClick={() => navigate("/")} className="btn-primary-gradient">
            Retour aux annonces
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Use photos from DB listing if available, otherwise mock images
  const images = dbListing?.photos?.length > 0 
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
    // Use secure seller contact data (only available to authenticated users)
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
      // Message button requires authentication but we can still start the flow
      await startConversation();
      return;
    }
    
    // User not authenticated - prompt them to login
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

    // Fetch seller contact to get user_id securely
    const contact = await getSellerContact(id!);
    if (!contact) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations du vendeur",
        variant: "destructive",
      });
      return;
    }

    // Can't message yourself
    if (currentUserId === contact.user_id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous envoyer un message",
      });
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('car_listing_id', dbListing.id)
        .eq('buyer_id', currentUserId)
        .eq('seller_id', contact.user_id)
        .maybeSingle();

      if (existingConvo) {
        navigate('/messages');
        return;
      }

      // Create new conversation using secure seller_id from contact
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

  const specs = [
    { icon: Calendar, label: "Année", value: car.year.toString() },
    { icon: Gauge, label: "Kilométrage", value: formatMileage(car.mileage) },
    { icon: Fuel, label: "Carburant", value: car.fuelType },
    { icon: Settings2, label: "Transmission", value: car.transmission },
    { icon: Leaf, label: "Norme Euro", value: car.euroNorm },
    { icon: MapPin, label: "Localisation", value: car.location },
  ];

  const description = dbListing?.description || `Superbe ${car.brand} ${car.model} de ${car.year} en excellent état.
Ce véhicule dispose d'une transmission ${car.transmission.toLowerCase()} et fonctionne au ${car.fuelType.toLowerCase()}. Avec seulement ${formatMileage(car.mileage)} au compteur, cette voiture est idéale pour les trajets quotidiens comme pour les longs voyages. Norme ${car.euroNorm}, compatible avec toutes les zones à faibles émissions de Belgique.`;

  // Use seller contact name if available (authenticated), otherwise show placeholder
  const sellerName = sellerContact?.contact_name || "Vendeur vérifié";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`${car.brand} ${car.model} ${car.year}`}
        description={`${car.brand} ${car.model} ${car.year} - ${formatPrice(car.price)} - ${formatMileage(car.mileage)} - ${car.fuelType} - ${car.location}`}
        image={car.image}
        url={`https://autora.be/car/${id}`}
        type="product"
      />
      <Header />
      <main className="pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux résultats
          </button>
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Image Gallery */}
              <div className="glass-card overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? images.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {car.isLezCompatible && (
                      <span className="lez-badge">
                        <Shield className="w-3 h-3" />
                        LEZ OK
                      </span>
                    )}
                    {car.hasCarPass && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-background/90 backdrop-blur-sm text-foreground">
                        <Shield className="w-4 h-4 text-primary" />
                        Car-Pass
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="p-4 flex gap-3 overflow-x-auto">
                    {images.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex
                            ? "border-primary"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Vue ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile-only: Title, Price & CTA */}
              <div className="lg:hidden glass-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-xl font-bold text-foreground">
                      {car.brand} {car.model}
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {car.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(car.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isFavorite(car.id)
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(car.id) ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-3xl font-display font-bold text-foreground">
                  {formatPrice(car.price)}
                </div>

                <div className="space-y-2.5">
                  {dbListing && (
                    <Button onClick={() => handleContact("Message")} className="w-full h-11 btn-primary-gradient">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Envoyer un message
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleContact("Appeler")} variant="outline" className="h-11">
                      <Phone className="w-4 h-4 mr-1" />
                      Appeler
                    </Button>
                    <Button onClick={() => handleContact("WhatsApp")} variant="outline" className="h-11">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>

                <SellerBadge
                  sellerType={dbListing?.seller_type}
                  sellerName={sellerName}
                  tvaNumber={dbListing?.tva_number}
                />
              </div>

              {/* Bento Specifications */}
              <BentoSpecs
                year={car.year}
                mileage={car.mileage}
                fuelType={car.fuelType}
                transmission={car.transmission}
                euroNorm={car.euroNorm}
                location={car.location}
                power={dbListing?.power}
                color={dbListing?.color}
                bodyType={dbListing?.body_type}
                doors={dbListing?.doors}
              />

              {/* Transparency Checklist */}
              <TransparencyChecklist
                carPassVerified={dbListing?.car_pass_verified}
                ctValid={dbListing?.ct_valid}
                maintenanceBookComplete={dbListing?.maintenance_book_complete}
              />

              {/* LEZ Widget */}
              <LezWidget euroNorm={car.euroNorm} fuelType={car.fuelType} />

              {/* Description */}
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  Description
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Reviews Section */}
              <ReviewsSection 
                carListingId={id!} 
                sellerId={sellerContact?.user_id}
              />
            </div>

            {/* Right Column - Price & Contact (desktop only) */}
            <div className="hidden lg:block space-y-6">
              {/* Price Card */}
              <div className="glass-card p-6 sticky top-24">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                      {car.brand} {car.model}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {car.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(car.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isFavorite(car.id)
                          ? "bg-red-500 text-white"
                          : "bg-secondary text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite(car.id) ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-4xl font-display font-bold text-foreground mb-6">
                  {formatPrice(car.price)}
                </div>

                <div className="space-y-3">
                  {dbListing && (
                    <Button
                      onClick={() => handleContact("Message")}
                      className="w-full h-12 btn-primary-gradient"
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

                {/* Seller Badge */}
                <SellerBadge
                  sellerType={dbListing?.seller_type}
                  sellerName={sellerName}
                  tvaNumber={dbListing?.tva_number}
                />

                {/* Disclaimer */}
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  AutoRa n'est pas intermédiaire de paiement. Ne payez jamais avant d'avoir vu le véhicule.
                </p>

                {/* Report Ad Button */}
                <div className="mt-4 pt-4 border-t border-border flex justify-center">
                  <ReportAdModal
                    carListingId={id!}
                    carBrand={car.brand}
                    carModel={car.model}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Related Cars */}
          {relatedCars.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold text-foreground mb-8">
                Véhicules similaires
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedCars.map((relatedCar) => (
                  <CarCard
                    key={relatedCar.id}
                    car={relatedCar}
                    isFavorite={isFavorite(relatedCar.id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={(id) => navigate(`/car/${id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
