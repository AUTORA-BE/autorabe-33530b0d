/**
 * FeaturedVehiclesSection — Véhicules en vedette (homepage).
 * Affiche les 6 dernières annonces approuvées dans une grille premium claire.
 * @module components/home/FeaturedVehiclesSection
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { usePopularVehicles } from '@/features/listings/hooks/usePopularVehicles';
import CarCard from '@/features/listings/components/CarCard';
import { CarCardSkeleton } from '@/components/skeletons/HomeSkeleton';
import { useFavorites } from '@/features/favorites';
import { useFavoriteCounts } from '@/features/favorites/hooks/useFavoriteCounts';
import { useLocalizedVehicleHref } from '@/lib/useLocalizedHref';
import { useNavigate } from 'react-router-dom';

const FeaturedVehiclesSection = () => {
  const { vehicles, isLoading } = usePopularVehicles({ limit: 6 });
  const { isFavorite, toggleFavorite } = useFavorites();
  const listingIds = useMemo(() => vehicles.map((v) => v.id), [vehicles]);
  const favCounts = useFavoriteCounts(listingIds);
  const vehicleHref = useLocalizedVehicleHref();
  const navigate = useNavigate();

  return (
    <section className="bg-[#fafafa] text-neutral-900 py-16 sm:py-24">
      <div className="container mx-auto max-w-[1280px] px-6 sm:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10 sm:mb-14">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium mb-3"
            >
              Sélection de la semaine
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-neutral-900"
            >
              Véhicules en vedette
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-neutral-600 text-base font-light mt-3"
            >
              Une sélection de voitures Car-Pass vérifiées, prêtes pour les zones LEZ belges.
            </motion.p>
          </div>

          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            Voir toutes les annonces
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-center text-neutral-500 text-sm py-10">
            Aucune annonce disponible pour le moment.
          </p>
        ) : (
          <>
            {/* Desktop / tablet grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {vehicles.slice(0, 6).map((vehicle, idx) => (
                <CarCard
                  key={vehicle.id}
                  car={vehicle}
                  isFavorite={isFavorite(vehicle.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => navigate(vehicleHref(vehicle))}
                  favoriteCount={favCounts[vehicle.id]}
                  eager={idx === 0}
                />
              ))}
            </div>

            {/* Mobile horizontal scroll */}
            <div
              className="sm:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 pb-2"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {vehicles.slice(0, 6).map((vehicle, idx) => (
                <div key={vehicle.id} className="flex-shrink-0 w-[78vw] snap-start">
                  <CarCard
                    car={vehicle}
                    isFavorite={isFavorite(vehicle.id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => navigate(vehicleHref(vehicle))}
                    favoriteCount={favCounts[vehicle.id]}
                    eager={idx === 0}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedVehiclesSection;
