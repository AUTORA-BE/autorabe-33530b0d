/**
 * Hook for client-side vehicle filtering and sorting
 * Used for in-memory filtering of already-fetched vehicles
 * @module features/search/hooks/useCarFilters
 */
import { useState, useMemo } from "react";
import type { Vehicle } from "@/features/listings/types/vehicle.types";
import { CarFilters, defaultFilters } from "@/types/filters";

/**
 * Hook for filtering and sorting an array of vehicles client-side
 * @param vehicles - Array of vehicles to filter
 * @returns Filtered vehicles, filter state, and update functions
 */
export const useCarFilters = (vehicles: Vehicle[]) => {
  const [filters, setFilters] = useState<CarFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<string>("recent");

  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Search query filter (brand + model)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (vehicle) =>
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query) ||
          `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(query)
      );
    }

    // Brand filter
    if (filters.brand) {
      result = result.filter(
        (vehicle) => vehicle.brand.toLowerCase() === filters.brand.toLowerCase()
      );
    }

    // Model filter
    if (filters.model) {
      result = result.filter(
        (vehicle) => vehicle.model.toLowerCase() === filters.model.toLowerCase()
      );
    }

    // Price filter
    result = result.filter(
      (vehicle) => vehicle.price >= filters.minPrice && vehicle.price <= filters.maxPrice
    );

    // Fuel type filter
    if (filters.fuelTypes.length > 0) {
      result = result.filter((vehicle) => {
        const fuelType = vehicle.fuelType.toLowerCase();
        return filters.fuelTypes.some((f) => {
          if (f === "essence") return fuelType === "essence";
          if (f === "diesel") return fuelType === "diesel";
          if (f === "hybride") return fuelType === "hybride";
          if (f === "electrique") return fuelType === "électrique" || fuelType === "electrique";
          return false;
        });
      });
    }

    // Transmission filter
    if (filters.transmission) {
      result = result.filter(
        (vehicle) =>
          vehicle.transmission.toLowerCase() === filters.transmission.toLowerCase()
      );
    }

    // Euro norm filter
    if (filters.euroNorm) {
      result = result.filter((vehicle) => vehicle.euroNorm === filters.euroNorm);
    }

    // Year filter
    result = result.filter(
      (vehicle) => vehicle.year >= filters.yearMin && vehicle.year <= filters.yearMax
    );

    // Kilometer filter
    result = result.filter(
      (vehicle) => vehicle.mileage >= filters.kmMin && vehicle.mileage <= filters.kmMax
    );

    // LEZ filter
    if (filters.lezOnly) {
      result = result.filter((vehicle) => vehicle.isLezCompatible);
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "year-desc":
        result.sort((a, b) => b.year - a.year);
        break;
      case "year-asc":
        result.sort((a, b) => a.year - b.year);
        break;
      case "km-asc":
        result.sort((a, b) => a.mileage - b.mileage);
        break;
      case "km-desc":
        result.sort((a, b) => b.mileage - a.mileage);
        break;
      default:
        // Recent = by ID desc (newest first)
        result.sort((a, b) => a.id.localeCompare(b.id));
    }

    return result;
  }, [vehicles, filters, sortBy]);

  /**
   * Update a single filter value
   */
  const updateFilter = <K extends keyof CarFilters>(
    key: K,
    value: CarFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Reset all filters to default values
   */
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

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
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filteredVehicles,
    sortBy,
    setSortBy,
    activeFiltersCount,
  };
};
