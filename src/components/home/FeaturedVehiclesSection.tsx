/**
 * FeaturedVehiclesSection — homepage section premium "Véhicules en vedette".
 * Fond clair, en-tête éditorial AutoRA, grille 4 cols desktop / scroll horizontal mobile.
 * @module components/home/FeaturedVehiclesSection
 */

import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useLocalizedVehicleHref } from '@/lib/useLocalizedHref';
import type { Vehicle } from '@/features/listings/types/vehicle.types';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop';

const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p);

const formatKm = (km: number) =>
  `${new Intl.NumberFormat('fr-BE').format(km)} km`;

function FeaturedListingCard({ vehicle, href }: { vehicle: Vehicle; href: string }) {
  const isElectric = /lectri/i.test(vehicle.fuelType);
  const motorLabel = isElectric ? '100% Électrique' : vehicle.fuelType;

  return (
    <Link
      to={href}
      className="group block rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
    >
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        <img
          src={vehicle.image || FALLBACK_IMG}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {vehicle.hasCarPass && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3" strokeWidth={2} />
            Car-Pass
          </span>
        )}
        <span
          className={
            isElectric
              ? 'absolute top-3 right-3 bg-neutral-950/80 text-primary border border-primary/30 text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm'
              : 'absolute top-3 right-3 bg-neutral-950/70 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm capitalize'
          }
        >
          {motorLabel}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-base font-medium tracking-tight text-foreground line-clamp-1">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="text-[12.5px] font-light text-muted-foreground mt-1">
          {vehicle.year} · {formatKm(vehicle.mileage)} · <span className="capitalize">{vehicle.fuelType}</span>
        </p>
        <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground mt-3">
          {formatPrice(vehicle.price)}
        </p>
        <p className="text-[12.5px] font-light text-muted-foreground mt-2 inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" strokeWidth={1.75} />
          {vehicle.location}
        </p>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-[16/10] bg-muted animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

const FeaturedVehiclesSection = () => {
  const { listings, loading, error } = useFeaturedListings(8);
  const vehicleHref = useLocalizedVehicleHref();

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-2xl">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
              Sélection de la semaine
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight text-foreground">
              Véhicules en vedette
            </h2>
            <p className="text-sm sm:text-base font-light leading-relaxed text-muted-foreground">
              Une sélection de voitures Car-Pass vérifiées, prêtes pour les zones LEZ belges.
            </p>
          </div>

          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden md:inline-flex items-center gap-2 text-primary hover:text-primary font-medium transition-colors group"
          >
            Voir toutes les annonces
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            Impossible de charger les annonces pour le moment.
          </p>
        ) : listings.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            Aucune annonce disponible pour le moment.
          </p>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((v) => (
                <FeaturedListingCard key={v.id} vehicle={v} href={vehicleHref(v)} />
              ))}
            </div>
            <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-4 scrollbar-hide">
              {listings.map((v) => (
                <div key={v.id} className="min-w-[280px] snap-start">
                  <FeaturedListingCard vehicle={v} href={vehicleHref(v)} />
                </div>
              ))}
            </div>
            <div className="md:hidden mt-6 flex justify-center">
              <Link
                to="/"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary font-medium transition-colors"
              >
                Voir toutes les annonces
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedVehiclesSection;
