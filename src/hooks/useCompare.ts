import { useState, useCallback, useEffect } from "react";
import type { Car } from "@/features/listings";

const MAX_COMPARE_ITEMS = 3;
const STORAGE_KEY = "autora-compare";

export const useCompare = () => {
  const [compareList, setCompareList] = useState<Car[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = useCallback((car: Car) => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      if (prev.some((c) => c.id === car.id)) return prev;
      return [...prev, car];
    });
  }, []);

  const removeFromCompare = useCallback((carId: string) => {
    setCompareList((prev) => prev.filter((c) => c.id !== carId));
  }, []);

  const isInCompare = useCallback(
    (carId: string) => compareList.some((c) => c.id === carId),
    [compareList]
  );

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
