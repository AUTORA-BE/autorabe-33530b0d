/**
 * Hook for fetching popular/featured vehicles
 * Used for the homepage carousel
 * @module features/listings/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { vehicleQueries, mapListingToVehicle } from '../api/vehicleQueries';
import type { Vehicle, VehicleListingRow } from '../types/vehicle.types';

/** Query key for popular vehicles */
const POPULAR_VEHICLES_KEY = 'popularVehicles';

interface UsePopularVehiclesOptions {
  /** Maximum number of vehicles to fetch */
  limit?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

interface UsePopularVehiclesResult {
  /** Array of popular vehicles */
  vehicles: Vehicle[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Fetches popular vehicles for the homepage carousel
 * Uses React Query for caching with a longer stale time
 * 
 * @param options - Configuration options
 * @returns Popular vehicles data and loading state
 * 
 * @example
 * ```tsx
 * const { vehicles, isLoading } = usePopularVehicles({ limit: 8 });
 * 
 * if (isLoading) return <Skeleton />;
 * return <Carousel vehicles={vehicles} />;
 * ```
 */
export function usePopularVehicles(
  options: UsePopularVehiclesOptions = {}
): UsePopularVehiclesResult {
  const { limit = 8, enabled = true } = options;

  const { 
    data, 
    isLoading, 
    error,
    refetch,
  } = useQuery({
    queryKey: [POPULAR_VEHICLES_KEY, limit],
    queryFn: async () => {
      // Use prefetched data if available (breaks critical request chain)
      const prefetched = (window as any).__prefetchedPopular;
      if (prefetched && limit === 8) {
        (window as any).__prefetchedPopular = null;
        const result = await prefetched;
        if (result) return (result as VehicleListingRow[]).map(row => mapListingToVehicle(row));
      }
      return vehicleQueries.getPopular(limit);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });

  return {
    vehicles: data || [],
    isLoading,
    error: error?.message || null,
    refetch,
  };
}

export default usePopularVehicles;
