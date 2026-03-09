/**
 * Hook for fetching a single vehicle's details
 * @module features/listings/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { vehicleQueries } from '../api/vehicleQueries';
import { vehicleKeys } from '../api/vehicleKeys';
import type { VehicleDetail } from '../types/vehicle.types';

interface UseVehicleDetailOptions {
  /** Whether to enable the query */
  enabled?: boolean;
}

interface UseVehicleDetailResult {
  /** Vehicle details or null if not found */
  vehicle: VehicleDetail | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the vehicle was not found */
  isNotFound: boolean;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Fetches detailed information for a single vehicle
 * Used on the vehicle detail page
 * 
 * @param vehicleId - UUID of the vehicle to fetch
 * @param options - Configuration options
 * @returns Vehicle detail data and loading state
 * 
 * @example
 * ```tsx
 * const { vehicle, isLoading, isNotFound } = useVehicleDetail(id);
 * 
 * if (isLoading) return <DetailSkeleton />;
 * if (isNotFound) return <NotFound />;
 * return <VehicleDetailPage vehicle={vehicle} />;
 * ```
 */
export function useVehicleDetail(
  vehicleId: string | undefined,
  options: UseVehicleDetailOptions = {}
): UseVehicleDetailResult {
  const { enabled = true } = options;

  const { 
    data, 
    isLoading, 
    error,
    refetch,
  } = useQuery({
    queryKey: vehicleKeys.detail(vehicleId!),
    queryFn: () => vehicleQueries.getById(vehicleId!),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: enabled && !!vehicleId,
  });

  return {
    vehicle: data || null,
    isLoading,
    error: error?.message || null,
    isNotFound: !isLoading && !error && !data,
    refetch,
  };
}

export default useVehicleDetail;
