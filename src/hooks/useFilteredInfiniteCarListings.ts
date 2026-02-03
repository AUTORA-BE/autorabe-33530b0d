/**
 * Hook that combines filtering with infinite scroll
 * @deprecated Use useVehicleSearch from features/listings instead
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CarFilters, defaultFilters } from '@/types/filters';
import { mapListingToVehicle, PAGE_SIZE } from '@/features/listings/api/vehicleQueries';
import type { Car, VehicleListingRow } from '@/features/listings/types/vehicle.types';

// Re-export for backward compatibility
const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

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
  const [sortBy, setSortBy] = useState<string>("recent");

  // Build query with filters
  const buildQuery = useCallback((baseQuery: any) => {
    let query = baseQuery;

    // Search query filter (brand + model)
    if (filters.searchQuery) {
      const searchTerm = `%${filters.searchQuery}%`;
      query = query.or(`brand.ilike.${searchTerm},model.ilike.${searchTerm}`);
    }

    // Brand filter
    if (filters.brand) {
      query = query.ilike('brand', filters.brand);
    }

    // Model filter
    if (filters.model) {
      query = query.ilike('model', filters.model);
    }

    // Price filter
    if (filters.minPrice > 0) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice < 200000) {
      query = query.lte('price', filters.maxPrice);
    }

    // Fuel type filter
    if (filters.fuelTypes.length > 0) {
      const fuelConditions = filters.fuelTypes.map(f => {
        if (f === 'electrique') return `fuel_type.ilike.%lectrique%`;
        return `fuel_type.ilike.${f}`;
      }).join(',');
      query = query.or(fuelConditions);
    }

    // Transmission filter
    if (filters.transmission) {
      query = query.ilike('transmission', filters.transmission);
    }

    // Euro norm filter
    if (filters.euroNorm) {
      query = query.eq('euro_norm', filters.euroNorm);
    }

    // Year filter
    if (filters.yearMin > 2010) {
      query = query.gte('year', filters.yearMin);
    }
    if (filters.yearMax < 2026) {
      query = query.lte('year', filters.yearMax);
    }

    // Kilometer filter
    if (filters.kmMin > 0) {
      query = query.gte('mileage', filters.kmMin);
    }
    if (filters.kmMax < 200000) {
      query = query.lte('mileage', filters.kmMax);
    }

    // LEZ filter - Euro 6+ or electric
    if (filters.lezOnly) {
      query = query.or('euro_norm.in.(Euro 6,Euro 6b,Euro 6c,Euro 6d),fuel_type.ilike.%lectrique%');
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        query = query.order('price', { ascending: true });
        break;
      case "price-desc":
        query = query.order('price', { ascending: false });
        break;
      case "year-desc":
        query = query.order('year', { ascending: false });
        break;
      case "year-asc":
        query = query.order('year', { ascending: true });
        break;
      case "km-asc":
        query = query.order('mileage', { ascending: true });
        break;
      case "km-desc":
        query = query.order('mileage', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  }, [filters, sortBy]);

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
      
      countQuery = buildQuery(countQuery);
      const { count } = await countQuery;

      if (count !== null) {
        setTotalCount(count);
      }

      // Fetch paginated data with filters
      let dataQuery = supabase
        .from('car_listings_public')
        .select('*');
      
      dataQuery = buildQuery(dataQuery);
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
  }, [buildQuery]);

  // Reset and refetch when filters or sort change
  useEffect(() => {
    setPage(0);
    setCars([]);
    setHasMore(true);
    fetchListings(0, false);
  }, [filters, sortBy]);

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
