/**
 * Admin dashboard type definitions
 * @module features/admin/types
 */

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  pendingReports: number;
  totalReports: number;
  suspendedUsers: number;
  todayMessages: number;
  estimatedRevenue: number;
}

export interface AdminUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  garage_name: string | null;
  postal_code: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  listing_count: number;
  subscription_product_id: string | null;
  subscription_status: string | null;
  subscription_end: string | null;
}

export interface AdminListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  location: string | null;
  photos: string[] | null;
  contact_name: string;
  contact_email: string;
  created_at: string;
  status: string;
  seller_type: string | null;
  description: string | null;
  euro_norm: string | null;
  boost_level: string | null;
  boost_expires_at: string | null;
  boost_rank: number | null;
  body_type?: string | null;
  color?: string | null;
  power?: number | null;
  doors?: number | null;
  ct_valid?: boolean | null;
  maintenance_book_complete?: boolean | null;
  car_pass_verified?: boolean | null;
  car_pass_date?: string | null;
  car_pass_url?: string | null;
  features?: string[] | null;
}

export interface AdminReport {
  id: string;
  car_listing_id: string;
  user_id: string;
  reason: string;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  car_brand?: string;
  car_model?: string;
  reporter_name?: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  ip_hash: string | null;
  created_at: string;
  user_name?: string;
}

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export type AdminTab = 'overview' | 'users' | 'listings' | 'reports' | 'logs' | 'exports';
