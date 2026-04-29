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
    photos: listing.photos?.length ? listing.photos : [DEFAULT_VEHICLE_IMAGE],
    isLezCompatible,
    hasCarPass: listing.car_pass_verified || false,
    sellerType: listing.seller_type || 'particulier',
    boostLevel: listing.boost_level || 'none',
    isBoosted: !!(listing.boost_level && listing.boost_level !== 'none' && 
      (!listing.boost_expires_at || new Date(listing.boost_expires_at) > new Date())),
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
export function applySorting<T>(query: T, sortBy: VehicleSortOption): T {
  const q = query as any;
  
  // Boosted listings first: 'none' is default/last, 'ultra'/'premium'/'standard' come first
  // Using descending so ultra > premium > standard > none
  const withBoostPriority = q
    .order('boost_level', { ascending: false, nullsFirst: false });
  
  switch (sortBy) {
    case 'price-asc':
      return withBoostPriority.order('price', { ascending: true }).order('id', { ascending: true });
    case 'price-desc':
      return withBoostPriority.order('price', { ascending: false }).order('id', { ascending: true });
    case 'year-desc':
      return withBoostPriority.order('year', { ascending: false }).order('id', { ascending: true });
    case 'year-asc':
      return withBoostPriority.order('year', { ascending: true }).order('id', { ascending: true });
    case 'km-asc':
      return withBoostPriority.order('mileage', { ascending: true }).order('id', { ascending: true });
    case 'km-desc':
      return withBoostPriority.order('mileage', { ascending: false }).order('id', { ascending: true });
    default:
      return withBoostPriority.order('created_at', { ascending: false }).order('id', { ascending: true });
  }
}

/**
 * Applies filters to a Supabase query
 */
export function applyFilters<T>(query: T, filters: VehicleFilters): T {
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

  // Seller type filter
  if (filters.sellerTypeFilter) {
    q = q.eq('seller_type', filters.sellerTypeFilter);
  }

  // Body type filter
  if (filters.bodyType) {
    q = q.ilike('body_type', filters.bodyType);
  }

  // Color filter
  if (filters.color) {
    q = q.ilike('color', filters.color);
  }

  // Province filter — matches against the free-text `location` column
  // We build a list of representative cities + the province name itself
  // and use a single OR with ilike for fuzzy matching (case + accents tolerant).
  if (filters.province) {
    const cities = PROVINCE_CITIES[filters.province] || [filters.province];
    const conditions = cities.map((c) => `location.ilike.%${c}%`).join(',');
    q = q.or(conditions);
  }

  return q as T;
}

/**
 * Mapping province ID → list of representative cities/keywords
 * Used to filter the free-text `location` column server-side.
 */
const PROVINCE_CITIES: Record<string, string[]> = {
  bruxelles: ['bruxelles', 'brussel', 'brussels', 'ixelles', 'uccle', 'schaerbeek', 'anderlecht', 'molenbeek', 'etterbeek', 'forest', 'jette', 'woluwe', 'evere', 'auderghem'],
  anvers: ['anvers', 'antwerpen', 'antwerp', 'malines', 'mechelen', 'turnhout', 'lierre', 'lier', 'geel', 'mortsel'],
  'brabant-flamand': ['louvain', 'leuven', 'vilvorde', 'vilvoorde', 'hal', 'halle', 'tirlemont', 'tienen', 'diest', 'aerschot', 'aarschot'],
  'brabant-wallon': ['wavre', 'nivelles', 'ottignies', 'louvain-la-neuve', 'jodoigne', 'tubize', 'braine-l\'alleud', 'rixensart', 'genappe'],
  'flandre-occidentale': ['bruges', 'brugge', 'courtrai', 'kortrijk', 'ostende', 'oostende', 'roulers', 'roeselare', 'ypres', 'ieper', 'furnes', 'veurne', 'menin', 'menen'],
  'flandre-orientale': ['gand', 'gent', 'alost', 'aalst', 'saint-nicolas', 'sint-niklaas', 'termonde', 'dendermonde', 'audenarde', 'oudenaarde', 'renaix', 'ronse', 'eeklo'],
  hainaut: ['mons', 'charleroi', 'tournai', 'la louvière', 'la louviere', 'mouscron', 'soignies', 'ath', 'binche', 'thuin', 'chimay'],
  liege: ['liège', 'liege', 'verviers', 'huy', 'seraing', 'herstal', 'spa', 'eupen', 'malmedy', 'waremme', 'visé', 'vise'],
  limbourg: ['hasselt', 'genk', 'tongres', 'tongeren', 'saint-trond', 'sint-truiden', 'bilzen', 'lommel', 'maaseik', 'beringen'],
  luxembourg: ['arlon', 'bastogne', 'marche-en-famenne', 'neufchâteau', 'neufchateau', 'virton', 'durbuy', 'libramont', 'saint-hubert'],
  namur: ['namur', 'dinant', 'philippeville', 'gembloux', 'andenne', 'ciney', 'rochefort', 'florennes'],
};

/** Explicit columns for list queries — avoids SELECT * overhead */
const LIST_COLUMNS = 'id,brand,model,year,price,mileage,fuel_type,transmission,euro_norm,location,photos,car_pass_verified,seller_type,boost_level,boost_expires_at' as const;

/** Full columns for detail queries */
const DETAIL_COLUMNS = 'id,brand,model,year,price,mileage,fuel_type,transmission,euro_norm,location,photos,car_pass_verified,seller_type,boost_level,boost_expires_at,description,body_type,color,power,doors,features,ct_valid,maintenance_book_complete,first_registration,created_at,updated_at,status' as const;

/**
 * Vehicle query functions object
 * Centralized API for all vehicle-related database operations
 */
export const vehicleQueries = {
  /**
   * Fetches paginated vehicle listings with filters and sorting
   * For popularity sorts (favorites/views/interactions), fetches a larger set
   * and sorts client-side using the get_listing_popularity RPC.
   */
  async list(
    filters: VehicleFilters, 
    sortBy: VehicleSortOption = 'recent',
    page: number = 0
  ): Promise<{ vehicles: Vehicle[]; total: number; hasMore: boolean }> {
    const isPopularitySort = ['favorites', 'views', 'interactions'].includes(sortBy);

    // Only request count on first page; subsequent pages skip it to avoid
    // a full COUNT scan on every "load more" call. Use 'planned' (planner
    // estimate) which is much faster than 'exact' on large filtered sets.
    const countMode = page === 0 ? 'planned' : undefined;
    let query = applyFilters(
      supabase.from('car_listings_public').select(LIST_COLUMNS, countMode ? { count: countMode } : undefined),
      filters
    );
    
    if (isPopularitySort) {
      // For popularity sorts: always boost first, then we'll re-sort by popularity
      query = query.order('boost_level', { ascending: false, nullsFirst: false });
      query = query.order('created_at', { ascending: false });
    } else {
      query = applySorting(query, sortBy);
    }
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    let vehicles = (data || []).map((row) => mapListingToVehicle(row as unknown as VehicleListingRow));

    // For popularity sorts, fetch counts and re-sort
    if (isPopularitySort && vehicles.length > 0) {
      const ids = vehicles.map(v => v.id);
      const { data: popData } = await supabase.rpc('get_listing_popularity', {
        listing_ids: ids,
      } as any);

      if (popData) {
        const popMap: Record<string, { favorites: number; views: number; interactions: number }> = {};
        for (const row of popData as any[]) {
          popMap[row.listing_id] = {
            favorites: Number(row.favorite_count),
            views: Number(row.view_count),
            interactions: Number(row.interaction_count),
          };
        }

        // Separate boosted and non-boosted, sort non-boosted by popularity
        const boosted = vehicles.filter(v => v.isBoosted);
        const nonBoosted = vehicles.filter(v => !v.isBoosted);

        const sortKey = sortBy === 'favorites' ? 'favorites' : sortBy === 'views' ? 'views' : 'interactions';
        nonBoosted.sort((a, b) => (popMap[b.id]?.[sortKey] || 0) - (popMap[a.id]?.[sortKey] || 0));

        vehicles = [...boosted, ...nonBoosted];
      }
    }

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
      .select(DETAIL_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

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

    const brands = [...new Set(data?.map((row: { brand: string | null }) => row.brand).filter(Boolean))] as string[];
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

    const models = [...new Set(data?.map((row: { model: string | null }) => row.model).filter(Boolean))] as string[];
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
      .select(LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map((row) => mapListingToVehicle(row as unknown as VehicleListingRow));
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
      .select(LIST_COLUMNS)
      .neq('id', vehicle.id)
      .or(`brand.eq.${vehicle.brand},fuel_type.ilike.${vehicle.fuelType}`)
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map((row) => mapListingToVehicle(row as unknown as VehicleListingRow));
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
