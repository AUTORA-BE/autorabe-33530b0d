import { describe, it, expect } from "vitest";
import { countActiveFilters } from "./activeFilters";
import { defaultVehicleFilters } from "../types/vehicle.types";

describe("countActiveFilters", () => {
  it("ne compte rien avec les filtres par défaut", () => {
    expect(countActiveFilters({ ...defaultVehicleFilters })).toBe(0);
  });

  it("compte les nouveaux champs ajoutés", () => {
    expect(countActiveFilters({ ...defaultVehicleFilters, kmMin: 1000 })).toBe(1);
    expect(countActiveFilters({ ...defaultVehicleFilters, sellerTypeFilter: "pro" })).toBe(1);
    expect(countActiveFilters({ ...defaultVehicleFilters, bodyType: "suv" })).toBe(1);
    expect(countActiveFilters({ ...defaultVehicleFilters, province: "Liège" })).toBe(1);
    expect(countActiveFilters({ ...defaultVehicleFilters, features: ["gps"] })).toBe(1);
    expect(
      countActiveFilters({ ...defaultVehicleFilters, maxDistanceKm: 50, userLat: 50.6 }),
    ).toBe(1);
  });

  it("ne compte pas la distance sans position", () => {
    expect(countActiveFilters({ ...defaultVehicleFilters, maxDistanceKm: 50 })).toBe(0);
  });

  it("cumule plusieurs filtres", () => {
    expect(
      countActiveFilters({
        ...defaultVehicleFilters,
        brand: "BMW",
        maxPrice: 25000,
        kmMax: 100000,
        bodyType: "suv",
      }),
    ).toBe(4);
  });
});
