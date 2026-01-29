/**
 * Listings feature barrel export
 * Re-exports all public APIs from the listings feature
 * @module features/listings
 */

// Types
export type {
  Vehicle,
  VehicleDetail,
  VehicleFilters,
  VehicleSearchResult,
  VehicleSortOption,
  FuelType,
  TransmissionType,
  EuroNorm,
  BodyType,
  SellerType,
} from './types/vehicle.types';

export { defaultVehicleFilters } from './types/vehicle.types';

// Components
export { VehicleCard, VehicleGrid, PopularVehicles } from './components';
export type { VehicleCardProps, VehicleGridProps, PopularVehiclesProps } from './components';

// API
export { vehicleQueries, mapListingToVehicle, mapListingToVehicleDetail, PAGE_SIZE } from './api/vehicleQueries';

// Hooks
export { useVehicleSearch } from './hooks/useVehicleSearch';
export { usePopularVehicles } from './hooks/usePopularVehicles';
export { useVehicleDetail } from './hooks/useVehicleDetail';
