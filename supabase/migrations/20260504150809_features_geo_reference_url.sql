-- ============================================================
-- Phase 1 + Phase 2 scaffolding
-- 1. reference_url  — competitor listing link on car_listings
-- 2. latitude/longitude — geo coordinates for distance search
-- 3. GIN index on features[] — fast faceted search
-- 4. listings_within_radius() — Haversine distance RPC
-- ============================================================

-- 1. reference_url
ALTER TABLE car_listings
  ADD COLUMN IF NOT EXISTS reference_url text;

-- 2. Geolocation columns
ALTER TABLE car_listings
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Partial index: only index rows that have coordinates (saves space)
CREATE INDEX IF NOT EXISTS idx_car_listings_geo
  ON car_listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. GIN index on features[] for fast array-containment queries
--    (@> operator used by Supabase .contains())
CREATE INDEX IF NOT EXISTS idx_car_listings_features
  ON car_listings USING gin (features)
  WHERE features IS NOT NULL;

-- 4. Haversine distance function
--    Returns rows from approved listings within <radius_km> of a point.
--    Uses LEAST(1.0, …) to guard against floating-point domain errors in acos().
CREATE OR REPLACE FUNCTION listings_within_radius(
  user_lat  double precision,
  user_lng  double precision,
  radius_km double precision
)
RETURNS TABLE (
  listing_id uuid,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id AS listing_id,
    (
      6371.0 * acos(
        LEAST(1.0,
          cos(radians(user_lat))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(user_lng))
          + sin(radians(user_lat))
            * sin(radians(latitude))
        )
      )
    ) AS distance_km
  FROM car_listings
  WHERE
    status    = 'approved'
    AND latitude  IS NOT NULL
    AND longitude IS NOT NULL
    AND (
      6371.0 * acos(
        LEAST(1.0,
          cos(radians(user_lat))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(user_lng))
          + sin(radians(user_lat))
            * sin(radians(latitude))
        )
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$$;
