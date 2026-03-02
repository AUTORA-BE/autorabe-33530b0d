/**
 * Unified hook for vehicle search with filtering, sorting, infinite scroll,
 * React Query caching, and URL query param persistence.
 * 
 * This is the SINGLE source of truth — replaces the former
 * useFilteredInfiniteCarListings and the old useVehicleSearch.
 * 
 * @module features/listings/hooks/useVehicleSearch
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleQueries, PAGE_SIZE } from '../api/vehicleQueries';
import type {
  Vehicle,
  VehicleFilters,
  VehicleSortOption,
} from '../types/vehicle.types';
import { defaultVehicleFilters } from '../types/vehicle.types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useFiltersUrlSync } from './useFiltersUrlSync';

/** Query key prefix for vehicle searches */
const VEHICLE_QUERY_KEY = 'vehicles';

interface UseVehicleSearchOptions {
  /** Initial filter overrides */
  initialFilters?: Partial<VehicleFilters>;
  /** Initial sort option */
  initialSort?: VehicleSortOption;
  /** Debounce delay in ms for filter changes (default 300) */
  debounceDelay?: number;
  /** Whether to sync filters with URL search params (default true) */
  syncUrl?: boolean;
}

/**
 * Unified vehicle search hook
 *
 * @example
 * ```tsx
 * const { vehicles, isLoading, filters, updateFilter, loadMore, hasMore } = useVehicleSearch();
 * updateFilter('brand', 'BMW');
 * ```
 */
export function useVehicleSearch(options: UseVehicleSearchOptions = {}) {
  const {
    initialFilters = {},
    initialSort = 'recent',
    debounceDelay = 300,
    syncUrl = true,
  } = options;

  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<VehicleFilters>({
    ...defaultVehicleFilters,
    ...initialFilters,
  });
  const [sortBy, setSortBy] = useState<VehicleSortOption>(initialSort);
  const [page, setPage] = useState(0);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── URL sync (opt-in, default on) ─────────────────────────────────
  if (syncUrl) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useFiltersUrlSync(filters, sortBy, setFilters, setSortBy);
  }

  // ── Debounce filters for API calls ────────────────────────────────
  const debouncedFilters = useDebounce(filters, debounceDelay);

  // ── React Query ───────────────────────────────────────────────────
  const queryKey = useMemo(
    () => [VEHICLE_QUERY_KEY, debouncedFilters, sortBy, page],
    [debouncedFilters, sortBy, page],
  );

  const {
    data,
    isLoading: isInitialLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => vehicleQueries.list(debouncedFilters, sortBy, page),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
        setAllVehicles((prev) => [...prev, ...data.vehicles]);
      }
      setIsLoadingMore(false);
    }
  }, [data, page]);

  // ── Actions ───────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!isLoadingMore && data?.hasMore) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, data?.hasMore]);

  const refresh = useCallback(() => {
    setPage(0);
    setAllVehicles([]);
    queryClient.invalidateQueries({ queryKey: [VEHICLE_QUERY_KEY] });
    refetch();
  }, [queryClient, refetch]);

  const updateFilter = useCallback(
    <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultVehicleFilters);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────
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
    if (filters.sellerTypeFilter) count++;
    if (filters.bodyType) count++;
    return count;
  }, [filters]);

  // ── Return (backward-compatible with both old hooks) ──────────────
  return {
    // New canonical name
    vehicles: allVehicles,
    // Legacy alias used by Index.tsx / LoadMoreGrid
    cars: allVehicles,

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
