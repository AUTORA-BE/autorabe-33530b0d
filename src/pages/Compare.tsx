import { Header, Footer } from "@/shared/components";
import { useCompareContext } from "@/features/compare";
import { Link } from "react-router-dom";
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
  Info
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

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompareContext();

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
                <Button variant="outline" onClick={clearCompare} className="rounded-xl">
                  Tout effacer
                </Button>
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
