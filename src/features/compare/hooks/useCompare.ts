/**
 * Hook for managing vehicle comparison list
 * Provides local storage persistence and comparison utilities
 * @module features/compare/hooks/useCompare
 */
import { useState, useCallback, useEffect } from "react";
import type { Vehicle } from "@/features/listings/types/vehicle.types";

/** Maximum number of vehicles that can be compared simultaneously */
const MAX_COMPARE_ITEMS = 3;

/** Local storage key for persisting comparison list */
const STORAGE_KEY = "autora-compare";

/**
 * Hook to manage vehicle comparison functionality
 * @returns Object containing comparison list, actions, and state
 */
export const useCompare = () => {
  const [compareList, setCompareList] = useState<Vehicle[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  /**
   * Add a vehicle to the comparison list
   * @param vehicle - Vehicle to add
   */
  const addToCompare = useCallback((vehicle: Vehicle) => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      if (prev.some((v) => v.id === vehicle.id)) return prev;
      return [...prev, vehicle];
    });
  }, []);

  /**
   * Remove a vehicle from the comparison list
   * @param vehicleId - ID of vehicle to remove
   */
  const removeFromCompare = useCallback((vehicleId: string) => {
    setCompareList((prev) => prev.filter((v) => v.id !== vehicleId));
  }, []);

  /**
   * Check if a vehicle is in the comparison list
   * @param vehicleId - ID to check
   * @returns True if vehicle is being compared
   */
  const isInCompare = useCallback(
    (vehicleId: string) => compareList.some((v) => v.id === vehicleId),
    [compareList]
  );

  /**
   * Clear all vehicles from comparison list
   */
  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const canAddMore = compareList.length < MAX_COMPARE_ITEMS;

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    isInCompare,
    clearCompare,
    canAddMore,
    compareCount: compareList.length,
  };
};
