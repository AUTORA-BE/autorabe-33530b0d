/**
 * Car filters interface
 * @deprecated Use VehicleFilters from features/listings/types instead
 */
import { 
  VehicleFilters, 
  defaultVehicleFilters 
} from "@/features/listings/types/vehicle.types";

export interface CarFilters extends VehicleFilters {}

export const defaultFilters: CarFilters = defaultVehicleFilters;
