/**
 * Favorite type matching the Supabase `favorites` table
 * @module features/favorites/types
 */
export interface Favorite {
  id: string;
  user_id: string;
  car_listing_id: string;
  created_at: string;
}
