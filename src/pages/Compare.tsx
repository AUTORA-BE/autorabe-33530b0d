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
  Palette,
  Cog,
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompareContext();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-BE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat("fr-BE").format(km) + " km";
  };

  const specs = [
    { key: "price", label: "Prix", icon: null, format: (car: typeof compareList[0]) => formatPrice(car.price) },
    { key: "year", label: "Année", icon: Calendar, format: (car: typeof compareList[0]) => car.year.toString() },
    { key: "mileage", label: "Kilométrage", icon: Gauge, format: (car: typeof compareList[0]) => formatMileage(car.mileage) },
    { key: "fuelType", label: "Carburant", icon: Fuel, format: (car: typeof compareList[0]) => car.fuelType },
    { key: "transmission", label: "Transmission", icon: Cog, format: (car: typeof compareList[0]) => car.transmission },
    { key: "euroNorm", label: "Norme Euro", icon: Leaf, format: (car: typeof compareList[0]) => car.euroNorm },
    { key: "location", label: "Localisation", icon: MapPin, format: (car: typeof compareList[0]) => car.location },
    { key: "isLezCompatible", label: "Compatible LEZ", icon: Shield, format: (car: typeof compareList[0]) => car.isLezCompatible ? "Oui" : "Non" },
    { key: "hasCarPass", label: "Car-Pass", icon: Shield, format: (car: typeof compareList[0]) => car.hasCarPass ? "Vérifié" : "Non vérifié" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-12">
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
                  <Button className="btn-primary-gradient">
                    Parcourir les véhicules
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Car Headers */}
                <div className="grid gap-4 p-6 border-b border-border" style={{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }}>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-muted-foreground">Véhicule</span>
                  </div>
                  {compareList.map((car) => (
                    <div key={car.id} className="relative">
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Link to={`/car/${car.id}`} className="block group">
                        <div className="aspect-video rounded-xl overflow-hidden mb-3">
                          <img
                            src={car.image}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
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
                        Ajouter un véhicule
                      </span>
                    </Link>
                  )}
                </div>

                {/* Specs Comparison */}
                {specs.map((spec, index) => (
                  <div 
                    key={spec.key}
                    className={`grid gap-4 p-6 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                    style={{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }}
                  >
                    <div className="flex items-center gap-2">
                      {spec.icon && <spec.icon className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm font-medium text-muted-foreground">{spec.label}</span>
                    </div>
                    {compareList.map((car) => (
                      <div key={car.id} className="flex items-center">
                        <span className={`font-medium ${spec.key === 'price' ? 'text-lg text-primary font-bold' : 'text-foreground'}`}>
                          {spec.format(car)}
                        </span>
                      </div>
                    ))}
                    {compareList.length < 3 && <div />}
                  </div>
                ))}
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
