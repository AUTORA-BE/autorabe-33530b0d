/**
 * Types for the Seller Dashboard feature
 * @module features/listings/types
 */

/**
 * Vehicle listing stats for dashboard display
 */
export interface SellerListing {
  /** Unique identifier */
  id: string;
  /** Vehicle brand */
  brand: string;
  /** Vehicle model */
  model: string;
  /** Manufacturing year */
  year: number;
  /** Price in EUR */
  price: number;
  /** Listing status */
  status: 'approved' | 'pending' | 'rejected' | 'sold';
  /** Primary photo URL */
  photo: string | null;
  /** Total views count */
  views: number;
  /** Conversation/messages count */
  messages: number;
  /** Favorites count */
  favorites: number;
  /** Creation timestamp */
  createdAt: string;
  /** Euro emission norm for LEZ */
  euroNorm: string | null;
  /** Car-Pass verification status */
  carPassVerified: boolean;
  /** Fuel type */
  fuelType: string;
}

/**
 * Dashboard totals
 */
export interface DashboardTotals {
  views: number;
  messages: number;
  favorites: number;
  listings: number;
}

/**
 * Daily stats for charts
 */
export interface DailyStats {
  date: string;
  dateLabel: string;
  views: number;
  messages: number;
  favorites: number;
}

/**
 * Status filter options
 */
export type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected' | 'sold';

/**
 * Chart period options
 */
export type ChartPeriod = 7 | 30 | 90;
