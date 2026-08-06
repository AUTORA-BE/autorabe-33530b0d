/**
 * Utility functions for car/vehicle operations
 * @module utils/carUtils
 */
import { supabase } from "@/integrations/supabase/client";
import { mapListingToVehicle } from "@/features/listings/api/vehicleQueries";
import type { Car, VehicleListingRow } from "@/features/listings/types/vehicle.types";
import { ALL_BRANDS, getModelsForBrand } from "@/data/brandModels";

const mapListingToCar = (listing: VehicleListingRow): Car => {
  return mapListingToVehicle(listing);
};

export const getAllBrands = (): string[] => {
  return ALL_BRANDS;
};

/**
 * Get models by brand — merges known models with any additional models from the database
 */
export const getModelsByBrand = async (brand: string): Promise<string[]> => {
  if (!brand) return [];

  const knownModels = getModelsForBrand(brand);

  try {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('model')
      .eq('brand', brand)
      .eq('status', 'approved');

    if (error || !data) return knownModels;

    const dbModels = [...new Set(data.map(item => item.model).filter(Boolean))] as string[];
    // Merge known + db, deduplicate, sort
    const merged = [...new Set([...knownModels, ...dbModels])];
    return merged.sort();
  } catch {
    return knownModels;
  }
};


export const getPriceRange = (): { min: number; max: number } => {
  return { min: 0, max: 1000000 };
};

export const getYearRange = (): { min: number; max: number } => {
  return { min: 1900, max: new Date().getFullYear() };
};

export const getMileageRange = (): { min: number; max: number } => {
  return { min: 0, max: 500000 };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatMileage = (km: number): string => {
  return new Intl.NumberFormat("fr-BE").format(km) + " km";
};

export const getCarByIdFromDb = async (id: string): Promise<Car | null> => {
  try {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data || !data.id) return null;
    return mapListingToCar(data as VehicleListingRow);
  } catch {
    return null;
  }
};

export const getSellerContact = async (listingId: string): Promise<{
  contact_name: string;
  contact_phone: string | null;
  contact_email: string;
  user_id: string;
} | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_seller_contact', { listing_id: listingId });
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
};

/**
 * Public seller display info for an approved listing.
 * Used on the public car detail page so anonymous visitors can see
 * the seller's display name (garage_name for Pro, display_name for private).
 */
export const getSellerDisplay = async (listingId: string): Promise<{
  user_id: string;
  display_name: string | null;
  garage_name: string | null;
  user_type: string | null;
  avatar_url: string | null;
  vitrine_slug: string | null;
  vitrine_published: boolean | null;
} | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_seller_display', { listing_id: listingId });
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
};

export const getRelatedCarsFromList = (car: Car, allCars: Car[], limit: number = 4) => {
  return allCars
    .filter((c) => c.id !== car.id && (c.brand === car.brand || c.fuelType === car.fuelType))
    .slice(0, limit);
};
