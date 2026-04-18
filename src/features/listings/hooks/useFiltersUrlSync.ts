/**
 * Hook to sync VehicleFilters + sort with URL search params
 * Enables shareable filtered search URLs
 * @module features/listings/hooks/useFiltersUrlSync
 */
import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { VehicleFilters, VehicleSortOption } from '../types/vehicle.types';
import { defaultVehicleFilters } from '../types/vehicle.types';

/** Param keys used in URL */
const PARAM_KEYS = {
  q: 'q',
  brand: 'brand',
  model: 'model',
  minPrice: 'pmin',
  maxPrice: 'pmax',
  fuelTypes: 'fuel',
  transmission: 'trans',
  euroNorm: 'euro',
  yearMin: 'ymin',
  yearMax: 'ymax',
  kmMin: 'kmin',
  kmMax: 'kmax',
  lezOnly: 'lez',
  sellerType: 'seller',
  bodyType: 'body',
  province: 'prov',
  sort: 'sort',
} as const;

/**
 * Parse URL search params into filters + sort
 */
export function parseFiltersFromParams(params: URLSearchParams): {
  filters: VehicleFilters;
  sortBy: VehicleSortOption;
} {
  const d = defaultVehicleFilters;

  const filters: VehicleFilters = {
    searchQuery: params.get(PARAM_KEYS.q) || d.searchQuery,
    brand: params.get(PARAM_KEYS.brand) || d.brand,
    model: params.get(PARAM_KEYS.model) || d.model,
    minPrice: Number(params.get(PARAM_KEYS.minPrice)) || d.minPrice,
    maxPrice: Number(params.get(PARAM_KEYS.maxPrice)) || d.maxPrice,
    fuelTypes: params.get(PARAM_KEYS.fuelTypes)
      ? params.get(PARAM_KEYS.fuelTypes)!.split(',')
      : d.fuelTypes,
    transmission: params.get(PARAM_KEYS.transmission) || d.transmission,
    euroNorm: params.get(PARAM_KEYS.euroNorm) || d.euroNorm,
    yearMin: Number(params.get(PARAM_KEYS.yearMin)) || d.yearMin,
    yearMax: Number(params.get(PARAM_KEYS.yearMax)) || d.yearMax,
    kmMin: Number(params.get(PARAM_KEYS.kmMin)) || d.kmMin,
    kmMax: Number(params.get(PARAM_KEYS.kmMax)) || d.kmMax,
    lezOnly: params.get(PARAM_KEYS.lezOnly) === '1',
    sellerTypeFilter: params.get(PARAM_KEYS.sellerType) || d.sellerTypeFilter,
    bodyType: params.get(PARAM_KEYS.bodyType) || d.bodyType,
    color: params.get('color') || d.color,
    province: params.get(PARAM_KEYS.province) || d.province,
  };

  const sortBy = (params.get(PARAM_KEYS.sort) as VehicleSortOption) || 'recent';

  return { filters, sortBy };
}

/**
 * Serialize filters + sort to URL search params (only non-default values)
 */
function filtersToParams(filters: VehicleFilters, sortBy: VehicleSortOption): URLSearchParams {
  const d = defaultVehicleFilters;
  const params = new URLSearchParams();

  if (filters.searchQuery) params.set(PARAM_KEYS.q, filters.searchQuery);
  if (filters.brand) params.set(PARAM_KEYS.brand, filters.brand);
  if (filters.model) params.set(PARAM_KEYS.model, filters.model);
  if (filters.minPrice !== d.minPrice) params.set(PARAM_KEYS.minPrice, String(filters.minPrice));
  if (filters.maxPrice !== d.maxPrice) params.set(PARAM_KEYS.maxPrice, String(filters.maxPrice));
  if (filters.fuelTypes.length > 0) params.set(PARAM_KEYS.fuelTypes, filters.fuelTypes.join(','));
  if (filters.transmission) params.set(PARAM_KEYS.transmission, filters.transmission);
  if (filters.euroNorm) params.set(PARAM_KEYS.euroNorm, filters.euroNorm);
  if (filters.yearMin !== d.yearMin) params.set(PARAM_KEYS.yearMin, String(filters.yearMin));
  if (filters.yearMax !== d.yearMax) params.set(PARAM_KEYS.yearMax, String(filters.yearMax));
  if (filters.kmMin !== d.kmMin) params.set(PARAM_KEYS.kmMin, String(filters.kmMin));
  if (filters.kmMax !== d.kmMax) params.set(PARAM_KEYS.kmMax, String(filters.kmMax));
  if (filters.lezOnly) params.set(PARAM_KEYS.lezOnly, '1');
  if (filters.sellerTypeFilter) params.set(PARAM_KEYS.sellerType, filters.sellerTypeFilter);
  if (filters.bodyType) params.set(PARAM_KEYS.bodyType, filters.bodyType);
  if (filters.color) params.set('color', filters.color);
  if (filters.province) params.set(PARAM_KEYS.province, filters.province);
  if (sortBy !== 'recent') params.set(PARAM_KEYS.sort, sortBy);

  return params;
}

/**
 * Hook that keeps filters + sortBy in sync with URL search params.
 * Reads initial state from URL on mount, writes changes back.
 */
export function useFiltersUrlSync(
  filters: VehicleFilters,
  sortBy: VehicleSortOption,
  setFilters: (f: VehicleFilters) => void,
  setSortBy: (s: VehicleSortOption) => void,
  enabled: boolean = true,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialized = useRef(false);

  // On mount: read URL → state (only once)
  useEffect(() => {
    if (!enabled) return;
    if (isInitialized.current) return;
    isInitialized.current = true;

    const hasParams = searchParams.toString().length > 0;
    if (!hasParams) return;

    const { filters: urlFilters, sortBy: urlSort } = parseFiltersFromParams(searchParams);
    setFilters(urlFilters);
    setSortBy(urlSort);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // On filter/sort change: state → URL
  const syncToUrl = useCallback(() => {
    if (!enabled || !isInitialized.current) return;
    const newParams = filtersToParams(filters, sortBy);
    setSearchParams(newParams, { replace: true });
  }, [enabled, filters, sortBy, setSearchParams]);

  useEffect(() => {
    syncToUrl();
  }, [syncToUrl]);
}
