/**
 * TanStack Query key factory pour les véhicules
 * Centralise toutes les clés de cache pour éviter les duplications
 * et garantir l'invalidation correcte.
 *
 * @module features/listings/api/vehicleKeys
 *
 * @example
 * ```ts
 * // Utilisation dans un hook
 * useQuery({ queryKey: vehicleKeys.detail(id), queryFn: ... });
 *
 * // Invalidation ciblée
 * queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
 * ```
 */

import type { VehicleFilters, VehicleSortOption } from '../types/vehicle.types';

export const vehicleKeys = {
  /** Racine — invalide TOUT le cache véhicules */
  all: ['vehicles'] as const,

  /** Toutes les listes (search, popular, seller…) */
  lists: () => [...vehicleKeys.all, 'list'] as const,

  /** Liste filtrée + triée + paginée */
  list: (filters: VehicleFilters | string, sort: VehicleSortOption, page: number) => [
    ...vehicleKeys.lists(),
    typeof filters === 'string' ? filters : JSON.stringify(filters),
    sort,
    page,
  ] as const,

  /** Véhicules populaires (carousel) */
  popular: (limit: number) => [...vehicleKeys.all, 'popular', limit] as const,

  /** Tous les détails */
  details: () => [...vehicleKeys.all, 'detail'] as const,

  /** Détail d'un véhicule spécifique */
  detail: (id: string) => [...vehicleKeys.details(), id] as const,

  /** Véhicules similaires */
  related: (id: string) => [...vehicleKeys.all, 'related', id] as const,

  /** Annonces du vendeur (dashboard) */
  seller: (userId: string) => [...vehicleKeys.all, 'seller', userId] as const,

  /** Statistiques vendeur */
  sellerStats: (userId: string, period: number) => [
    ...vehicleKeys.seller(userId),
    'stats',
    period,
  ] as const,
} as const;
