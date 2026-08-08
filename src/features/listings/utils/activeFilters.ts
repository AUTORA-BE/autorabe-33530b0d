/**
 * Comptage des filtres actifs — source unique partagée entre la page
 * /recherche et la barre flottante mobile (pastille de compteur).
 * @module features/listings/utils/activeFilters
 */
import { parseFiltersFromParams } from "../hooks/useFiltersUrlSync";
import { defaultVehicleFilters, type VehicleFilters } from "../types/vehicle.types";

/** Nombre de filtres réellement modifiés par l'utilisateur. */
export function countActiveFilters(filters: VehicleFilters): number {
  const d = defaultVehicleFilters;
  let n = 0;
  if (filters.searchQuery) n++;
  if (filters.brand) n++;
  if (filters.model) n++;
  if (filters.location) n++;
  if (filters.minPrice > d.minPrice) n++;
  if (filters.maxPrice < d.maxPrice) n++;
  if (filters.kmMax < d.kmMax) n++;
  if (filters.fuelTypes?.length) n++;
  if (filters.transmission) n++;
  if (filters.color) n++;
  if (filters.euroNorm) n++;
  if (filters.lezOnly) n++;
  if (filters.yearMin > d.yearMin) n++;
  if (filters.yearMax < d.yearMax) n++;
  return n;
}

/** Même comptage, à partir de la query string (?brand=…&pmax=…). */
export function countActiveFiltersFromSearch(search: string): number {
  const params = new URLSearchParams(search);
  if (!params.toString()) return 0;
  return countActiveFilters(parseFiltersFromParams(params).filters);
}

/** Événement écouté par /recherche pour ouvrir le panneau plein écran. */
export const OPEN_MOBILE_SEARCH_EVENT = "autora:open-mobile-search";
