/**
 * Centralized API layer for vehicle queries
 * All Supabase vehicle-related queries should go through this module
 * @module features/listings/api
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Vehicle, 
  VehicleDetail, 
  VehicleFilters, 
  VehicleListingRow,
  VehicleSortOption 
} from '../types/vehicle.types';

/** Default placeholder image for vehicles without photos */
const DEFAULT_VEHICLE_IMAGE = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';

/** Euro norms that grant LEZ access */
const LEZ_COMPATIBLE_NORMS = ['Euro 6d', 'Euro 6c', 'Euro 6b', 'Euro 6'];

/** Page size for paginated queries */
export const PAGE_SIZE = 20;

/**
 * Maps a database row to the Vehicle interface
 * Handles null values and computes derived fields like LEZ compatibility
 */
export function mapListingToVehicle(listing: VehicleListingRow): Vehicle {
  const isElectric = 
    listing.fuel_type?.toLowerCase() === 'électrique' || 
    listing.fuel_type?.toLowerCase() === 'electrique';
  
  const isLezCompatible = 
    LEZ_COMPATIBLE_NORMS.includes(listing.euro_norm || '') || isElectric;

  return {
    id: listing.id,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    mileage: listing.mileage,
    fuelType: listing.fuel_type,
    transmission: listing.transmission,
    euroNorm: listing.euro_norm || 'Non spécifié',
    location: listing.location || 'Belgique',
    image: listing.photos?.[0] || DEFAULT_VEHICLE_IMAGE,
    isLezCompatible,
    hasCarPass: listing.car_pass_verified || false,
  };
}

/**
 * Maps a database row to the VehicleDetail interface
 * Includes all fields for the detail page
 */
export function mapListingToVehicleDetail(listing: VehicleListingRow): VehicleDetail {
  const base = mapListingToVehicle(listing);
  
  return {
    ...base,
    description: listing.description,
    bodyType: listing.body_type,
    color: listing.color,
    power: listing.power,
    doors: listing.doors || 5,
    features: listing.features,
    photos: listing.photos || [DEFAULT_VEHICLE_IMAGE],
    ctValid: listing.ct_valid || false,
    maintenanceBookComplete: listing.maintenance_book_complete || false,
    firstRegistration: listing.first_registration,
    sellerType: listing.seller_type || 'particulier',
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
  };
}

/**
 * Applies sort order to a Supabase query
 */
function applySorting<T>(query: T, sortBy: VehicleSortOption): T {
  const queryWithOrder = query as any;
  
  switch (sortBy) {
    case 'price-asc':
      return queryWithOrder.order('price', { ascending: true });
    case 'price-desc':
      return queryWithOrder.order('price', { ascending: false });
    case 'year-desc':
      return queryWithOrder.order('year', { ascending: false });
    case 'year-asc':
      return queryWithOrder.order('year', { ascending: true });
    case 'km-asc':
      return queryWithOrder.order('mileage', { ascending: true });
    case 'km-desc':
      return queryWithOrder.order('mileage', { ascending: false });
    default:
      return queryWithOrder.order('created_at', { ascending: false });
  }
}

/**
 * Applies filters to a Supabase query
 */
function applyFilters<T>(query: T, filters: VehicleFilters): T {
  let q = query as any;

  // Search query filter (brand + model)
  if (filters.searchQuery) {
    const searchTerm = `%${filters.searchQuery}%`;
    q = q.or(`brand.ilike.${searchTerm},model.ilike.${searchTerm}`);
  }

  // Brand filter
  if (filters.brand) {
    q = q.ilike('brand', filters.brand);
  }

  // Model filter
  if (filters.model) {
    q = q.ilike('model', filters.model);
  }

  // Price filter
  if (filters.minPrice > 0) {
    q = q.gte('price', filters.minPrice);
  }
  if (filters.maxPrice < 200000) {
    q = q.lte('price', filters.maxPrice);
  }

  // Fuel type filter
  if (filters.fuelTypes.length > 0) {
    const fuelConditions = filters.fuelTypes.map(f => {
      if (f === 'electrique') return `fuel_type.ilike.%lectrique%`;
      return `fuel_type.ilike.${f}`;
    }).join(',');
    q = q.or(fuelConditions);
  }

  // Transmission filter
  if (filters.transmission) {
    q = q.ilike('transmission', filters.transmission);
  }

  // Euro norm filter
  if (filters.euroNorm) {
    q = q.eq('euro_norm', filters.euroNorm);
  }

  // Year filter
  if (filters.yearMin > 2010) {
    q = q.gte('year', filters.yearMin);
  }
  if (filters.yearMax < new Date().getFullYear() + 1) {
    q = q.lte('year', filters.yearMax);
  }

  // Kilometer filter
  if (filters.kmMin > 0) {
    q = q.gte('mileage', filters.kmMin);
  }
  if (filters.kmMax < 200000) {
    q = q.lte('mileage', filters.kmMax);
  }

  // LEZ filter - Euro 6+ or electric
  if (filters.lezOnly) {
    q = q.or('euro_norm.in.(Euro 6,Euro 6b,Euro 6c,Euro 6d),fuel_type.ilike.%lectrique%');
  }

  return q as T;
}

/**
 * Vehicle query functions object
 * Centralized API for all vehicle-related database operations
 */
export const vehicleQueries = {
  /**
   * Fetches paginated vehicle listings with filters and sorting
   * @param filters - Filter criteria to apply
   * @param sortBy - Sort order option
   * @param page - Page number (0-indexed)
   * @returns Promise with vehicles array, total count, and hasMore flag
   */
  async list(
    filters: VehicleFilters, 
    sortBy: VehicleSortOption = 'recent',
    page: number = 0
  ): Promise<{ vehicles: Vehicle[]; total: number; hasMore: boolean }> {
    // Get total count with filters
    let countQuery = supabase
      .from('car_listings_public')
      .select('*', { count: 'exact', head: true });
    
    countQuery = applyFilters(countQuery, filters);
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(countError.message);
    }

    const total = count || 0;

    // Fetch paginated data with filters
    let dataQuery = supabase
      .from('car_listings_public')
      .select('*');
    
    dataQuery = applyFilters(dataQuery, filters);
    dataQuery = applySorting(dataQuery, sortBy);
    dataQuery = dataQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, error: fetchError } = await dataQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const vehicles = (data || []).map(row => mapListingToVehicle(row as VehicleListingRow));
    const hasMore = vehicles.length === PAGE_SIZE && (page + 1) * PAGE_SIZE < total;

    return { vehicles, total, hasMore };
  },

  /**
   * Fetches a single vehicle by ID with full details
   * @param id - Vehicle UUID
   * @returns Promise with VehicleDetail or null if not found
   */
  async getById(id: string): Promise<VehicleDetail | null> {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return mapListingToVehicleDetail(data as VehicleListingRow);
  },

  /**
   * Fetches all available brands (for filter dropdowns)
   * @returns Promise with sorted array of unique brand names
   */
  async getBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('brand');

    if (error) {
      throw new Error(error.message);
    }

    const brands = [...new Set(data?.map(row => row.brand).filter(Boolean))] as string[];
    return brands.sort();
  },

  /**
   * Fetches models for a specific brand (for cascading filter dropdowns)
   * @param brand - Brand name to filter by
   * @returns Promise with sorted array of unique model names
   */
  async getModelsByBrand(brand: string): Promise<string[]> {
    if (!brand) return [];

    const { data, error } = await supabase
      .from('car_listings_public')
      .select('model')
      .ilike('brand', brand);

    if (error) {
      throw new Error(error.message);
    }

    const models = [...new Set(data?.map(row => row.model).filter(Boolean))] as string[];
    return models.sort();
  },

  /**
   * Fetches popular/featured vehicles for the homepage carousel
   * @param limit - Maximum number of vehicles to fetch
   * @returns Promise with array of vehicles
   */
  async getPopular(limit: number = 8): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(row => mapListingToVehicle(row as VehicleListingRow));
  },

  /**
   * Fetches related vehicles based on brand or fuel type
   * @param vehicle - Reference vehicle to find related items for
   * @param limit - Maximum number of related vehicles
   * @returns Promise with array of related vehicles
   */
  async getRelated(vehicle: Vehicle, limit: number = 4): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('car_listings_public')
      .select('*')
      .neq('id', vehicle.id)
      .or(`brand.eq.${vehicle.brand},fuel_type.ilike.${vehicle.fuelType}`)
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(row => mapListingToVehicle(row as VehicleListingRow));
  },

  /**
   * Gets seller contact information (requires authentication)
   * @param listingId - Vehicle listing UUID
   * @returns Promise with seller contact info or null
   */
  async getSellerContact(listingId: string): Promise<{
    contactName: string;
    contactPhone: string | null;
    contactEmail: string;
    userId: string;
  } | null> {
    const { data, error } = await supabase
      .rpc('get_seller_contact', { listing_id: listingId });

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      userId: row.user_id,
    };
  },
};

export default vehicleQueries;
