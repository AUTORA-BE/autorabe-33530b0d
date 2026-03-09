import { useEffect, useState } from "react";
import { Header, Footer } from "@/shared/components";
import { useCompareContext } from "@/features/compare";
import { Link, useSearchParams } from "react-router-dom";
import { 
  GitCompareArrows, 
  X, 
  Fuel, 
  Calendar, 
  Gauge, 
  Shield, 
  MapPin, 
  Car, 
  Cog,
  Leaf,
  CheckCircle,
  AlertTriangle,
  Ban,
  Info,
  Share2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculerStatutLEZ } from "@/lib/lezData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Vehicle } from "@/features/listings/types/vehicle.types";

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare, addToCompare } = useCompareContext();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);

  // Load vehicles from shared URL params
  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids || compareList.length > 0) return;

    const vehicleIds = ids.split(",").slice(0, 3);
    setLoadingShared(true);

    const loadSharedVehicles = async () => {
      const { data } = await supabase
        .from("car_listings_public")
        .select("*")
        .in("id", vehicleIds);

      if (data) {
        data.forEach((listing) => {
          const vehicle: Vehicle = {
            id: listing.id!,
            brand: listing.brand || "",
            model: listing.model || "",
            price: listing.price || 0,
            year: listing.year || 0,
            mileage: listing.mileage || 0,
            fuelType: listing.fuel_type || "",
            transmission: listing.transmission || "",
            image: listing.photos?.[0] || "/placeholder.svg",
            location: listing.location || "",
            euroNorm: listing.euro_norm || "",
            hasCarPass: listing.car_pass_verified || false,
            isLezCompatible: true,
            bodyType: listing.body_type || "",
            sellerType: listing.seller_type || undefined,
            isBoosted: !!(listing.boost_level && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date()),
          };
          addToCompare(vehicle);
        });
      }
      setLoadingShared(false);
    };

    loadSharedVehicles();
  }, [searchParams]);

  const handleShare = async () => {
    const ids = compareList.map((c) => c.id).join(",");
    const url = `${window.location.origin}/compare?ids=${ids}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Lien copié !", description: "Partagez ce lien pour montrer votre comparatif." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast({ title: "Lien copié !" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

  const formatMileage = (km: number) =>
    new Intl.NumberFormat("fr-BE").format(km) + " km";

  const lezStatusConfig = {
    autorise: { text: "Autorisé", className: "bg-primary/15 text-primary border-primary/30", Icon: CheckCircle },
    alerte: { text: "Alerte", className: "bg-amber-500/15 text-amber-600 border-amber-500/30", Icon: AlertTriangle },
    derogation_requise: { text: "Dérogation", className: "bg-amber-500/15 text-amber-600 border-amber-500/30", Icon: AlertTriangle },
    interdit: { text: "Interdit", className: "bg-destructive/15 text-destructive border-destructive/30", Icon: Ban },
    inconnu: { text: "Inconnu", className: "bg-muted text-muted-foreground", Icon: Info },
  } as const;

  const renderLezBadges = (car: typeof compareList[0]) => {
    const result = calculerStatutLEZ(car.fuelType, car.euroNorm);
    return (
      <div className="space-y-1.5">
        {result.details.map((d) => {
          const cfg = lezStatusConfig[d.statut] || lezStatusConfig.inconnu;
          return (
            <div key={d.ville} className="flex items-center gap-1.5">
              <Badge variant="outline" className={`${cfg.className} text-xs`}>
                <cfg.Icon className="w-3 h-3 mr-1" />
                {d.ville}
              </Badge>
              <span className="text-xs text-muted-foreground">{d.message}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const specs = [
    { label: "Prix", icon: null, render: (car: typeof compareList[0]) => (
      <span className="text-lg font-bold text-primary">{formatPrice(car.price)}</span>
    )},
    { label: "Année", icon: Calendar, render: (car: typeof compareList[0]) => car.year.toString() },
    { label: "Kilométrage", icon: Gauge, render: (car: typeof compareList[0]) => formatMileage(car.mileage) },
    { label: "Carburant", icon: Fuel, render: (car: typeof compareList[0]) => car.fuelType },
    { label: "Transmission", icon: Cog, render: (car: typeof compareList[0]) => car.transmission },
    { label: "Norme Euro", icon: Leaf, render: (car: typeof compareList[0]) => car.euroNorm || "—" },
    { label: "Localisation", icon: MapPin, render: (car: typeof compareList[0]) => car.location || "—" },
    { label: "Compatibilité LEZ", icon: Shield, render: renderLezBadges },
    { label: "Car-Pass", icon: Shield, render: (car: typeof compareList[0]) => (
      <Badge variant="outline" className={car.hasCarPass ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"}>
        {car.hasCarPass ? (
          <><CheckCircle className="w-3 h-3 mr-1" /> Vérifié</>
        ) : "Non vérifié"}
      </Badge>
    )},
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <GitCompareArrows className="w-4 h-4" />
                  Comparateur
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Comparer les <span className="gradient-text">véhicules</span>
                </h1>
              </div>
              {compareList.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="rounded-xl gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copied ? "Copié !" : "Partager"}
                  </Button>
                  <Button variant="outline" onClick={clearCompare} className="rounded-xl">
                    Tout effacer
                  </Button>
                </div>
              )}
            </div>

            {compareList.length === 0 ? (
              <div className="text-center py-20">
                <GitCompareArrows className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  Aucun véhicule à comparer
                </h2>
                <p className="text-muted-foreground mb-6">
                  Ajoutez jusqu'à 3 véhicules pour les comparer côte à côte.
                </p>
                <Link to="/">
                  <Button className="btn-primary-gradient">Parcourir les véhicules</Button>
                </Link>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Vehicle header row */}
                <div className="grid gap-4 p-6 border-b border-border" style={{ gridTemplateColumns: `180px repeat(${compareList.length}, 1fr)` }}>
                  <div />
                  {compareList.map((car) => (
                    <div key={car.id} className="relative">
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Link to={`/car/${car.id}`} className="block group">
                        <div className="aspect-video rounded-xl overflow-hidden mb-3 border border-border">
                          <img
                            src={car.image}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors text-center">
                          {car.brand} {car.model}
                        </h3>
                      </Link>
                    </div>
                  ))}
                  {compareList.length < 3 && (
                    <Link 
                      to="/"
                      className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors group"
                    >
                      <Car className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        Ajouter
                      </span>
                    </Link>
                  )}
                </div>

                {/* Comparison table */}
                <Table>
                  <TableBody>
                    {specs.map((spec, index) => (
                      <TableRow key={spec.label} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium text-muted-foreground w-[180px]">
                          <div className="flex items-center gap-2">
                            {spec.icon && <spec.icon className="w-4 h-4" />}
                            {spec.label}
                          </div>
                        </TableCell>
                        {compareList.map((car) => (
                          <TableCell key={car.id}>
                            {spec.render(car)}
                          </TableCell>
                        ))}
                        {compareList.length < 3 && <TableCell />}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
