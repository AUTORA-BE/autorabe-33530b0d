/**
 * Compare context for global vehicle comparison state
 * @module features/compare/context/CompareContext
 */
import React, { createContext, useContext, ReactNode } from "react";
import { useCompare } from "../hooks/useCompare";
import type { Vehicle } from "@/features/listings/types/vehicle.types";

interface CompareContextType {
  compareList: Vehicle[];
  addToCompare: (vehicle: Vehicle) => void;
  removeFromCompare: (vehicleId: string) => void;
  isInCompare: (vehicleId: string) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
  compareCount: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

/**
 * Provider component for vehicle comparison context
 */
export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const compare = useCompare();

  return (
    <CompareContext.Provider value={compare}>
      {children}
    </CompareContext.Provider>
  );
};

/**
 * Hook to access comparison context
 * @throws Error if used outside CompareProvider
 */
export const useCompareContext = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompareContext must be used within a CompareProvider");
  }
  return context;
};
