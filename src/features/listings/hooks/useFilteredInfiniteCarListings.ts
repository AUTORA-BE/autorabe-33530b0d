/**
 * Hook that combines filtering with infinite scroll
 * Uses centralized applyFilters/applySorting from vehicleQueries
 * @module features/listings/hooks/useFilteredInfiniteCarListings
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CarFilters, defaultFilters } from '@/types/filters';
import { mapListingToVehicle, applyFilters, applySorting, PAGE_SIZE } from '../api/vehicleQueries';
import type { Car, VehicleListingRow, VehicleSortOption } from '../types/vehicle.types';
import { useFiltersUrlSync } from './useFiltersUrlSync';

/**
 * Map database listing to Car type
 * @param listing - Raw database row
 * @returns Mapped Car object
 */
const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

/**
 * Hook for filtered infinite scroll vehicle listings
 * @returns Object containing cars, filters, pagination controls
 */
export function useFilteredInfiniteCarListings() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters state
  const [filters, setFilters] = useState<CarFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<VehicleSortOption>("recent");

  // Sync filters ↔ URL query params
  useFiltersUrlSync(filters, sortBy, setFilters, setSortBy);

  const fetchListings = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      // Get total count with filters
      let countQuery = supabase
        .from('car_listings_public')
        .select('*', { count: 'exact', head: true });
      
      countQuery = applyFilters(countQuery, filters);
      const { count } = await countQuery;

      if (count !== null) {
        setTotalCount(count);
      }

      // Fetch paginated data with filters + sorting
      let dataQuery = supabase
        .from('car_listings_public')
        .select('*');
      
      dataQuery = applyFilters(dataQuery, filters);
      dataQuery = applySorting(dataQuery, sortBy);
      dataQuery = dataQuery.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      const { data, error: fetchError } = await dataQuery;

      if (fetchError) {
        console.error('Error fetching listings:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        const mappedCars = data.map(mapListingToCar);
        
        if (append) {
          setCars(prev => [...prev, ...mappedCars]);
        } else {
          setCars(mappedCars);
        }

        // Check if there are more items
        setHasMore(data.length === PAGE_SIZE && (pageNum + 1) * PAGE_SIZE < (count || 0));
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors du chargement des annonces');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, sortBy]);

  // Reset and refetch when filters or sort change
  useEffect(() => {
    setPage(0);
    setCars([]);
    setHasMore(true);
    fetchListings(0, false);
  }, [fetchListings]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchListings(nextPage, true);
    }
  }, [isLoadingMore, hasMore, isLoading, page, fetchListings]);

  const refresh = useCallback(() => {
    setPage(0);
    setCars([]);
    setHasMore(true);
    fetchListings(0, false);
  }, [fetchListings]);

  const updateFilter = useCallback(<K extends keyof CarFilters>(
    key: K,
    value: CarFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.brand) count++;
    if (filters.model) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 200000) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.transmission) count++;
    if (filters.euroNorm) count++;
    if (filters.yearMin > 2010 || filters.yearMax < 2026) count++;
    if (filters.kmMin > 0 || filters.kmMax < 200000) count++;
    if (filters.lezOnly) count++;
    if (filters.sellerTypeFilter) count++;
    if (filters.bodyType) count++;
    return count;
  }, [filters]);

  return {
    cars,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    // Filter state and methods
    filters,
    updateFilter,
    resetFilters,
    sortBy,
    setSortBy,
    activeFiltersCount,
  };
}
