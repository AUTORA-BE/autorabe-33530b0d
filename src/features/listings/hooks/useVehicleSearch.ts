/**
 * Hook for searching and filtering vehicles with infinite scroll
 * Combines filters, sorting, pagination, and caching via React Query
 * @module features/listings/hooks
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleQueries, PAGE_SIZE } from '../api/vehicleQueries';
import type { 
  Vehicle, 
  VehicleFilters, 
  VehicleSortOption 
} from '../types/vehicle.types';
import { defaultVehicleFilters } from '../types/vehicle.types';
import { useDebounce } from '@/shared/hooks/useDebounce';

/** Query key factory for vehicle searches */
const VEHICLE_QUERY_KEY = 'vehicles';

interface UseVehicleSearchOptions {
  /** Initial filter values */
  initialFilters?: Partial<VehicleFilters>;
  /** Initial sort option */
  initialSort?: VehicleSortOption;
  /** Debounce delay in ms for filter changes */
  debounceDelay?: number;
}

interface UseVehicleSearchResult {
  /** Array of loaded vehicles */
  vehicles: Vehicle[];
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Loading state for loading more pages */
  isLoadingMore: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether more pages are available */
  hasMore: boolean;
  /** Load next page of results */
  loadMore: () => void;
  /** Refresh all data */
  refresh: () => void;
  /** Total count of matching vehicles */
  totalCount: number;
  /** Current filter values */
  filters: VehicleFilters;
  /** Update a single filter value */
  updateFilter: <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /** Current sort option */
  sortBy: VehicleSortOption;
  /** Update sort option */
  setSortBy: (sort: VehicleSortOption) => void;
  /** Number of active filters */
  activeFiltersCount: number;
}

/**
 * Main hook for vehicle search functionality
 * Provides filtering, sorting, pagination, and caching
 * 
 * @param options - Configuration options
 * @returns Search state and methods
 * 
 * @example
 * ```tsx
 * const {
 *   vehicles,
 *   isLoading,
 *   filters,
 *   updateFilter,
 *   loadMore,
 *   hasMore,
 * } = useVehicleSearch();
 * 
 * // Update a filter
 * updateFilter('brand', 'BMW');
 * 
 * // Load more results
 * if (hasMore) loadMore();
 * ```
 */
export function useVehicleSearch(options: UseVehicleSearchOptions = {}): UseVehicleSearchResult {
  const {
    initialFilters = {},
    initialSort = 'recent',
    debounceDelay = 300,
  } = options;

  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState<VehicleFilters>({
    ...defaultVehicleFilters,
    ...initialFilters,
  });
  
  // Sort state
  const [sortBy, setSortBy] = useState<VehicleSortOption>(initialSort);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounce filters for API calls
  const debouncedFilters = useDebounce(filters, debounceDelay);

  // Query key includes filters and sort for proper caching
  const queryKey = useMemo(
    () => [VEHICLE_QUERY_KEY, debouncedFilters, sortBy, page],
    [debouncedFilters, sortBy, page]
  );

  // Main data query
  const { 
    data, 
    isLoading: isInitialLoading, 
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => vehicleQueries.list(debouncedFilters, sortBy, page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Reset pagination when filters or sort change
  useEffect(() => {
    setPage(0);
    setAllVehicles([]);
  }, [debouncedFilters, sortBy]);

  // Accumulate vehicles for infinite scroll
  useEffect(() => {
    if (data?.vehicles) {
      if (page === 0) {
        setAllVehicles(data.vehicles);
      } else {
        setAllVehicles(prev => [...prev, ...data.vehicles]);
      }
      setIsLoadingMore(false);
    }
  }, [data, page]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!isLoadingMore && data?.hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [isLoadingMore, data?.hasMore]);

  // Refresh handler
  const refresh = useCallback(() => {
    setPage(0);
    setAllVehicles([]);
    queryClient.invalidateQueries({ queryKey: [VEHICLE_QUERY_KEY] });
    refetch();
  }, [queryClient, refetch]);

  // Update single filter
  const updateFilter = useCallback(<K extends keyof VehicleFilters>(
    key: K,
    value: VehicleFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(defaultVehicleFilters);
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.brand) count++;
    if (filters.model) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 200000) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.transmission) count++;
    if (filters.euroNorm) count++;
    if (filters.yearMin > 2010 || filters.yearMax < new Date().getFullYear() + 1) count++;
    if (filters.kmMin > 0 || filters.kmMax < 200000) count++;
    if (filters.lezOnly) count++;
    return count;
  }, [filters]);

  return {
    vehicles: allVehicles,
    isLoading: isInitialLoading && page === 0,
    isLoadingMore,
    error: queryError?.message || null,
    hasMore: data?.hasMore ?? false,
    loadMore,
    refresh,
    totalCount: data?.total ?? 0,
    filters,
    updateFilter,
    resetFilters,
    sortBy,
    setSortBy,
    activeFiltersCount,
  };
}

export default useVehicleSearch;
