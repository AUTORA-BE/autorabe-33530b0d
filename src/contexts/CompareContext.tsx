import React, { createContext, useContext, ReactNode } from "react";
import { useCompare } from "@/hooks/useCompare";
import type { Car } from "@/features/listings";

interface CompareContextType {
  compareList: Car[];
  addToCompare: (car: Car) => void;
  removeFromCompare: (carId: string) => void;
  isInCompare: (carId: string) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
  compareCount: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const compare = useCompare();

  return (
    <CompareContext.Provider value={compare}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompareContext = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompareContext must be used within a CompareProvider");
  }
  return context;
};
