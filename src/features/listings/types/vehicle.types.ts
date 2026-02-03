/**
 * Core vehicle types for the AutoRa marketplace
 * @module features/listings/types
 */

/** Fuel type options available in Belgium */
export type FuelType = 'diesel' | 'essence' | 'électrique' | 'hybride';

/** Transmission type options */
export type TransmissionType = 'manuelle' | 'automatique';

/** Euro emission norms for LEZ compatibility */
export type EuroNorm = 'Euro 3' | 'Euro 4' | 'Euro 5' | 'Euro 6' | 'Euro 6b' | 'Euro 6c' | 'Euro 6d';

/** Vehicle body types */
export type BodyType = 'Berline' | 'SUV' | 'Citadine' | 'Compacte' | 'Break' | 'Coupé' | 'Cabriolet' | 'Monospace';

/** Seller type classification */
export type SellerType = 'particulier' | 'professionnel';

/**
 * Core vehicle interface representing a car listing
 * Used throughout the application for displaying vehicle cards and details
 */
export interface Vehicle {
  /** Unique identifier (UUID) */
  id: string;
  /** Vehicle manufacturer brand */
  brand: string;
  /** Vehicle model name */
  model: string;
  /** Manufacturing year */
  year: number;
  /** Price in EUR */
  price: number;
  /** Mileage in kilometers */
  mileage: number;
  /** Fuel type */
  fuelType: string;
  /** Transmission type */
  transmission: string;
  /** Euro emission norm for LEZ */
  euroNorm: string;
  /** Location city in Belgium */
  location: string;
  /** Primary image URL */
  image: string;
  /** LEZ (Low Emission Zone) compatibility flag */
  isLezCompatible: boolean;
  /** Car-Pass verification status (mandatory in Belgium) */
  hasCarPass: boolean;
}

/**
 * Backward compatibility alias for Vehicle
 * @deprecated Use Vehicle instead
 */
export type Car = Vehicle;

/**
 * Extended vehicle interface with full details
 * Used on detail pages and for seller dashboard
 */
export interface VehicleDetail extends Vehicle {
  /** Full description text */
  description: string | null;
  /** Body type classification */
  bodyType: string;
  /** Exterior color */
  color: string;
  /** Engine power in CV/HP */
  power: number | null;
  /** Number of doors */
  doors: number;
  /** Array of feature strings */
  features: string[] | null;
  /** Array of photo URLs */
  photos: string[];
  /** Technical inspection validity */
  ctValid: boolean;
  /** Maintenance book completeness */
  maintenanceBookComplete: boolean;
  /** First registration date */
  firstRegistration: string | null;
  /** Seller type (private/professional) */
  sellerType: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Filter parameters for vehicle search
 * All fields are optional for flexible filtering
 */
export interface VehicleFilters {
  /** Free text search query */
  searchQuery: string;
  /** Filter by brand name */
  brand: string;
  /** Filter by model name */
  model: string;
  /** Minimum price in EUR */
  minPrice: number;
  /** Maximum price in EUR */
  maxPrice: number;
  /** Array of fuel types to include */
  fuelTypes: string[];
  /** Filter by transmission type */
  transmission: string;
  /** Filter by Euro norm */
  euroNorm: string;
  /** Minimum year */
  yearMin: number;
  /** Maximum year */
  yearMax: number;
  /** Minimum mileage in km */
  kmMin: number;
  /** Maximum mileage in km */
  kmMax: number;
  /** Only show LEZ-compatible vehicles */
  lezOnly: boolean;
}

/**
 * Default filter values
 */
export const defaultVehicleFilters: VehicleFilters = {
  searchQuery: "",
  brand: "",
  model: "",
  minPrice: 0,
  maxPrice: 200000,
  fuelTypes: [],
  transmission: "",
  euroNorm: "",
  yearMin: 2010,
  yearMax: new Date().getFullYear() + 1,
  kmMin: 0,
  kmMax: 200000,
  lezOnly: false,
};

/**
 * Pagination result for vehicle listings
 */
export interface VehicleSearchResult {
  /** Array of vehicles for current page */
  vehicles: Vehicle[];
  /** Total count across all pages */
  total: number;
  /** Current page number (0-indexed) */
  page: number;
  /** Whether more pages are available */
  hasMore: boolean;
}

/**
 * Sort options for vehicle listings
 */
export type VehicleSortOption = 
  | 'recent' 
  | 'price-asc' 
  | 'price-desc' 
  | 'year-desc' 
  | 'year-asc' 
  | 'km-asc' 
  | 'km-desc';

/**
 * Database listing row from Supabase
 * Matches the car_listings_public view schema
 */
export interface VehicleListingRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  euro_norm: string | null;
  location: string | null;
  photos: string[] | null;
  car_pass_verified: boolean | null;
  body_type: string;
  color: string;
  power: number | null;
  doors: number | null;
  description: string | null;
  features: string[] | null;
  ct_valid: boolean | null;
  maintenance_book_complete: boolean | null;
  first_registration: string | null;
  seller_type: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}
