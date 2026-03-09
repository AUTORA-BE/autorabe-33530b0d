/**
 * Utility functions for car/vehicle operations
 * @deprecated Use vehicleQueries from features/listings/api instead
 */
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { Car, VehicleListingRow } from "@/features/listings/types/vehicle.types";

// Re-export for backward compatibility
const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

// Common car brands for Belgium
const commonBrands = [
  "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda", "Hyundai",
  "Kia", "Mazda", "Mercedes-Benz", "Nissan", "Opel", "Peugeot", "Porsche",
  "Renault", "Seat", "Skoda", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

// Extract unique brands
export const getAllBrands = (): string[] => {
  return commonBrands;
};

// Get models by brand from database
export const getModelsByBrand = async (brand: string): Promise<string[]> => {
  if (!brand) return [];
  
  try {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('model')
      .eq('brand', brand)
      .eq('status', 'approved');

    if (error || !data) return [];

    const uniqueModels = [...new Set(data.map(item => item.model).filter(Boolean))] as string[];
    return uniqueModels.sort();
  } catch {
    return [];
  }
};

// Get price range
export const getPriceRange = (): { min: number; max: number } => {
  return { min: 5000, max: 150000 };
};

// Get year range
export const getYearRange = (): { min: number; max: number } => {
  const currentYear = new Date().getFullYear();
  return { min: 2010, max: currentYear };
};

// Get mileage range
export const getMileageRange = (): { min: number; max: number } => {
  return { min: 0, max: 300000 };
};

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
};

// Format mileage for display
export const formatMileage = (km: number): string => {
  return new Intl.NumberFormat("fr-BE").format(km) + " km";
};

// Get car by ID from database (using secure public view)
export const getCarByIdFromDb = async (id: string): Promise<Car | null> => {
  try {
    // Use the secure public view that excludes sensitive data
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data || !data.id) {
      return null;
    }

    return mapListingToCar(data as VehicleListingRow);
  } catch {
    return null;
  }
};

// Get seller contact info securely (authenticated users only)
export const getSellerContact = async (listingId: string): Promise<{
  contact_name: string;
  contact_phone: string | null;
  contact_email: string;
  user_id: string;
} | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_seller_contact', { listing_id: listingId });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch {
    return null;
  }
};

// Get related cars from a provided list
export const getRelatedCarsFromList = (car: Car, allCars: Car[], limit: number = 4) => {
  return allCars
    .filter(
      (c) =>
        c.id !== car.id && (c.brand === car.brand || c.fuelType === car.fuelType)
    )
    .slice(0, limit);
};
