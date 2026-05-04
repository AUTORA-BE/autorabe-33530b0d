/**
 * useVehicleSearchCursor — cursor-paginated alternative to useVehicleSearch.
 *
 * Use this when you don't need the total count (homepage, infinite scroll).
 * It scales O(log n) regardless of how deep the user scrolls — the standard
 * useVehicleSearch hook degrades on deep `OFFSET … LIMIT …` queries.
 *
 * Constraint: only the default 'recent' sort is supported here. Other
 * sorts still need useVehicleSearch (offset + total count).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleQueries } from '../api/vehicleQueries';
import { vehicleKeys } from '../api/vehicleKeys';
import type { Vehicle, VehicleFilters } from '../types/vehicle.types';
import { defaultVehicleFilters } from '../types/vehicle.types';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface Options {
  initialFilters?: Partial<VehicleFilters>;
  debounceDelay?: number;
  pageSize?: number;
}

type Cursor = { createdAt: string; id: string } | null;

export function useVehicleSearchCursor(options: Options = {}) {
  const { initialFilters = {}, debounceDelay = 300, pageSize = 20 } = options;
  const qc = useQueryClient();

  const [filters, setFilters] = useState<VehicleFilters>({
    ...defaultVehicleFilters,
    ...initialFilters,
  });
  const debounced = useDebounce(filters, debounceDelay);
  const debouncedKey = JSON.stringify(debounced);

  const queryKey = useMemo(
    () => [...vehicleKeys.lists(), 'cursor', debouncedKey, pageSize] as const,
    [debouncedKey, pageSize],
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      vehicleQueries.listCursor(debounced, pageParam as Cursor, pageSize),
    initialPageParam: null as Cursor,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Reset accumulated cache on filter change to avoid mixing old/new datasets
  useEffect(() => {
    qc.invalidateQueries({ queryKey });
  }, [debouncedKey, queryKey, qc]);

  const vehicles: Vehicle[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.vehicles) ?? [],
    [query.data],
  );

  const updateFilter = useCallback(
    <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'brand' && value !== prev.brand) next.model = '';
        return next;
      });
    },
    [],
  );

  const resetFilters = useCallback(() => setFilters(defaultVehicleFilters), []);

  return {
    vehicles,
    cars: vehicles,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error?.message ?? null,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    refresh: () => qc.invalidateQueries({ queryKey }),
    filters,
    updateFilter,
    resetFilters,
  };
}
