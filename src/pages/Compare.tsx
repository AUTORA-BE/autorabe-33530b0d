import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { useCompareContext } from "@/features/compare";
import { Link, useSearchParams } from "react-router-dom";
import { useLocalizedVehicleHref, useLocalizedHref } from "@/lib/useLocalizedHref";
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
  Check,
  Trophy,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculerStatutLEZ, type LezStatutType } from "@/lib/lezData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Vehicle } from "@/features/listings/types/vehicle.types";

// ─── Scoring Engine ──────────────────────────────────────────────────

interface VehicleScore {
  total: number;
  breakdown: {
    priceMileage: number;   // 0-30 — lower price per km = better
    ageValue: number;       // 0-20 — newer + cheaper = better
    lezCompat: number;      // 0-30 — LEZ compatibility across 3 cities
    carPass: number;        // 0-10 — verified = bonus
    transmission: number;   // 0-10 — auto = slight bonus
  };
  rank: number;
  label: string;
}

const LEZ_STATUS_SCORES: Record<LezStatutType, number> = {
  autorise: 10,
  alerte: 5,
  derogation_requise: 3,
  interdit: 0,
  inconnu: 2,
};

function computeScores(vehicles: Vehicle[]): Map<string, VehicleScore> {
  if (vehicles.length === 0) return new Map();

  const maxPrice = Math.max(...vehicles.map((v) => v.price), 1);
  // const _maxMileage = Math.max(...vehicles.map((v) => v.mileage), 1);
  const currentYear = new Date().getFullYear();

  const rawScores = vehicles.map((v) => {
    // Price/mileage ratio (30 pts) — lower cost per km is better
    const costPerKm = v.mileage > 0 ? v.price / v.mileage : v.price;
    const maxCostPerKm = Math.max(...vehicles.map((x) => x.mileage > 0 ? x.price / x.mileage : x.price), 1);
    const priceMileage = Math.round((1 - costPerKm / maxCostPerKm) * 30);

    // Age value (20 pts) — newer is better, adjusted by price
    const age = currentYear - v.year;
    const maxAge = Math.max(...vehicles.map((x) => currentYear - x.year), 1);
    const ageFreshness = 1 - age / maxAge;
    const priceRatio = 1 - v.price / maxPrice;
    const ageValue = Math.round(((ageFreshness * 0.6 + priceRatio * 0.4)) * 20);

    // LEZ compatibility (30 pts) — sum across 3 cities
    const lezResult = calculerStatutLEZ(v.fuelType, v.euroNorm);
    const lezCompat = lezResult.details.reduce((sum, d) => {
      return sum + (LEZ_STATUS_SCORES[d.statut] || 0);
    }, 0);

    // Car-Pass (10 pts)
    const carPass = v.hasCarPass ? 10 : 0;

    // Transmission (10 pts) — auto slight edge
    const transmission = v.transmission?.toLowerCase().includes("auto") ? 10 : 6;

    const total = priceMileage + ageValue + lezCompat + carPass + transmission;

    return {
      id: v.id,
      total,
      breakdown: { priceMileage, ageValue, lezCompat, carPass, transmission },
    };
  });

  // Rank
  const sorted = [...rawScores].sort((a, b) => b.total - a.total);
  const labels = ["Meilleur choix", "Bon choix", "À considérer"];

  const result = new Map<string, VehicleScore>();
  sorted.forEach((s, i) => {
    result.set(s.id, { ...s, rank: i + 1, label: labels[i] || "À considérer" });
  });

  return result;
}

// ─── Score Display Component ─────────────────────────────────────────

function ScoreCard({ score }: { score: VehicleScore }) {
  const isWinner = score.rank === 1;
  const colorClass = isWinner
    ? "text-primary"
    : score.rank === 2
    ? "text-amber-500"
    : "text-muted-foreground";

  const criteria = [
    { label: "Rapport prix/km", value: score.breakdown.priceMileage, max: 30 },
    { label: "Valeur/âge", value: score.breakdown.ageValue, max: 20 },
    { label: "Compat. LEZ", value: score.breakdown.lezCompat, max: 30 },
    { label: "Car-Pass", value: score.breakdown.carPass, max: 10 },
    { label: "Transmission", value: score.breakdown.transmission, max: 10 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isWinner && <Trophy className="w-5 h-5 text-primary" />}
        <span className={`text-2xl font-bold ${colorClass}`}>{score.total}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <Badge
        variant="outline"
        className={`${
          isWinner
            ? "bg-primary/15 text-primary border-primary/30"
            : score.rank === 2
            ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isWinner && <Star className="w-3 h-3 mr-1" />}
        {score.label}
      </Badge>
      <div className="space-y-2 pt-1">
        {criteria.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="text-muted-foreground">{c.label}</span>
              <span className="font-medium">{c.value}/{c.max}</span>
            </div>
            <Progress value={(c.value / c.max) * 100} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare, addToCompare } = useCompareContext();
  const vehicleHref = useLocalizedVehicleHref();
  const localized = useLocalizedHref();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [_loadingShared, setLoadingShared] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scores = useMemo(() => computeScores(compareList), [compareList]);

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
            sellerType: listing.seller_type || "",
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
    { label: "Score", icon: Trophy, render: (car: typeof compareList[0]) => {
      const score = scores.get(car.id);
      return score ? <ScoreCard score={score} /> : "—";
    }},
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

  // Find the best value for each spec across vehicles (for highlighting)
  const getBestForSpec = (specLabel: string): string | null => {
    if (compareList.length < 2) return null;
    if (specLabel === "Prix") {
      const min = Math.min(...compareList.map(c => c.price));
      return compareList.find(c => c.price === min)?.id || null;
    }
    if (specLabel === "Kilométrage") {
      const min = Math.min(...compareList.map(c => c.mileage));
      return compareList.find(c => c.mileage === min)?.id || null;
    }
    if (specLabel === "Année") {
      const max = Math.max(...compareList.map(c => c.year));
      return compareList.find(c => c.year === max)?.id || null;
    }
    return null;
  };

  // Intersection observer for active dot tracking
  const totalCards = compareList.length + (compareList.length < 3 ? 1 : 0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveCardIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [compareList.length]);

  const scrollToCard = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, []);

  return (
    <div className="page-gradient">
      <SEOHead
        title="Comparer des voitures d'occasion en Belgique"
        description="Comparez jusqu'à 3 voitures d'occasion côte à côte : prix, kilométrage, consommation, LEZ, Car-Pass. Faites le meilleur choix sur AutoRa."
        url="https://autora.be/compare"
      />
      <Header />
      
      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <BackButton to="/" className="mb-4" />
          <div className="max-w-6xl mx-auto">
            {/* Header — responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3">
                  <GitCompareArrows className="w-4 h-4" />
                  Comparateur
                </div>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Comparer les <span className="gradient-text">véhicules</span>
                </h1>
              </div>
              {compareList.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="rounded-xl gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? "Copié !" : "Partager"}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCompare} className="rounded-xl">
                    <X className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Effacer</span>
                  </Button>
                </div>
              )}
            </div>

            {compareList.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <GitCompareArrows className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 sm:mb-6" />
                <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-3">
                  Aucun véhicule à comparer
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Ajoutez jusqu'à 3 véhicules pour les comparer côte à côte.
                </p>
                <Link to="/">
                  <Button className="btn-primary-gradient">Parcourir les véhicules</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* ═══ MOBILE: Swipeable card layout ═══ */}
                <div className="lg:hidden space-y-6">
                  {/* Horizontal scrollable vehicle cards */}
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4"
                  >
                    {compareList.map((car, cardIndex) => {
                      const score = scores.get(car.id);
                      const isWinner = score?.rank === 1;
                      return (
                        <div
                          key={car.id}
                          ref={(el) => { cardRefs.current[cardIndex] = el; }}
                          className={`snap-center shrink-0 w-[85vw] max-w-[340px] rounded-2xl border bg-card overflow-hidden ${
                            isWinner ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                          }`}
                        >
                          {/* Vehicle image + remove */}
                          <div className="relative">
                            <Link to={vehicleHref(car)}>
                              <div className="aspect-[16/10] overflow-hidden">
                                <img
                                  src={car.image}
                                  alt={`${car.brand} ${car.model}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </Link>
                            <button
                              onClick={() => removeFromCompare(car.id)}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm text-foreground flex items-center justify-center shadow-lg"
                              aria-label={`Retirer ${car.brand} ${car.model}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {isWinner && (
                              <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                                <Trophy className="w-3 h-3" /> Meilleur choix
                              </div>
                            )}
                          </div>

                          {/* Vehicle info */}
                          <div className="p-4 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-display font-bold text-foreground text-base">
                                  {car.brand} {car.model}
                                </h3>
                                <p className="text-sm text-muted-foreground">{car.year} · {car.fuelType}</p>
                              </div>
                              <span className="text-lg font-bold text-primary whitespace-nowrap">
                                {formatPrice(car.price)}
                              </span>
                            </div>

                            {/* Score */}
                            {score && <ScoreCard score={score} />}

                            {/* Key specs */}
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { icon: Gauge, label: "Kilométrage", value: formatMileage(car.mileage), best: getBestForSpec("Kilométrage") === car.id },
                                { icon: Calendar, label: "Année", value: car.year.toString(), best: getBestForSpec("Année") === car.id },
                                { icon: Cog, label: "Transmission", value: car.transmission, best: false },
                                { icon: Leaf, label: "Norme Euro", value: car.euroNorm || "—", best: false },
                              ].map((spec) => (
                                <div
                                  key={spec.label}
                                  className={`flex items-center gap-2 rounded-xl p-2.5 text-sm ${
                                    spec.best ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-foreground'
                                  }`}
                                >
                                  <spec.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground leading-tight">{spec.label}</p>
                                    <p className="font-medium truncate text-xs">{spec.value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Location */}
                            {car.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">{car.location}</span>
                              </div>
                            )}

                            {/* LEZ */}
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" /> Compatibilité LEZ
                              </p>
                              {renderLezBadges(car)}
                            </div>

                            {/* Car-Pass */}
                            <Badge variant="outline" className={`w-fit ${car.hasCarPass ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"}`}>
                              {car.hasCarPass ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Car-Pass vérifié</>
                              ) : "Car-Pass non vérifié"}
                            </Badge>

                            {/* CTA */}
                            <Link to={vehicleHref(car)}>
                              <Button variant="outline" className="w-full rounded-xl mt-1">
                                Voir l'annonce
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add vehicle slot */}
                    {compareList.length < 3 && (
                      <Link
                        to={localized("/")}
                        ref={(el) => { cardRefs.current[compareList.length] = el as HTMLDivElement | null; }}
                        className="snap-center shrink-0 w-[85vw] max-w-[340px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[200px] hover:border-primary/50 transition-colors"
                      >
                        <Car className="w-10 h-10 text-muted-foreground mb-3" />
                        <span className="text-sm font-medium text-muted-foreground">Ajouter un véhicule</span>
                      </Link>
                    )}
                  </div>

                  {/* Active dots */}
                  {totalCards > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: totalCards }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => scrollToCard(i)}
                          aria-label={`Aller à la carte ${i + 1}`}
                          className={`rounded-full transition-all duration-300 ${
                            activeCardIndex === i
                              ? 'w-6 h-2.5 bg-primary'
                              : 'w-2.5 h-2.5 bg-primary/25 hover:bg-primary/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ═══ DESKTOP: Original table layout ═══ */}
                <div className="hidden lg:block bg-card border border-border rounded-2xl overflow-hidden">
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
                        <Link to={vehicleHref(car)} className="block group">
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
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
