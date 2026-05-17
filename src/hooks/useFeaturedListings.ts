/**
 * useFeaturedListings — 8 dernières annonces approuvées pour la homepage.
 * @module hooks/useFeaturedListings
 */

import { useQuery } from '@tanstack/react-query';
import { vehicleQueries } from '@/features/listings/api/vehicleQueries';
import type { Vehicle } from '@/features/listings/types/vehicle.types';

interface Result {
  listings: Vehicle[];
  loading: boolean;
  error: string | null;
}

export function useFeaturedListings(limit = 8): Result {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-listings', limit],
    queryFn: () => vehicleQueries.getPopular(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    listings: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

export default useFeaturedListings;
