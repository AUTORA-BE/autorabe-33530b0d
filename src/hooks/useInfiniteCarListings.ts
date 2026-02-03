/**
 * Hook for infinite scroll car listings
 * @deprecated Use useVehicleSearch from features/listings instead
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapListingToVehicle, PAGE_SIZE } from '@/features/listings/api/vehicleQueries';
import type { Car, VehicleListingRow } from '@/features/listings/types/vehicle.types';

// Re-export Vehicle mapping for backward compatibility
const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

export function useInfiniteCarListings() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchListings = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      // Get total count first
      const { count } = await supabase
        .from('car_listings_public')
        .select('*', { count: 'exact', head: true });

      if (count !== null) {
        setTotalCount(count);
      }

      // Fetch paginated data
      const { data, error: fetchError } = await supabase
        .from('car_listings_public')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

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
  }, []);

  useEffect(() => {
    fetchListings(0, false);
  }, [fetchListings]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchListings(nextPage, true);
    }
  }, [isLoadingMore, hasMore, page, fetchListings]);

  const refresh = useCallback(() => {
    setPage(0);
    setCars([]);
    fetchListings(0, false);
  }, [fetchListings]);

  return {
    cars,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
  };
}
