-- ============================================================
-- Task 3 — Geospatial index for proximity search
--
-- 1. Enable PostGIS
-- 2. Add coordinates GEOGRAPHY(Point, 4326) to car_listings
-- 3. GIST index for sub-millisecond ST_DWithin / ST_Distance lookups
-- 4. Trigger that keeps `coordinates` in sync with latitude/longitude
-- 5. listings_within_radius() rewritten to use ST_DWithin
--    (replaces the Haversine SQL function from 20260504150809)
-- 6. Recreate car_listings_public to expose coordinates for clients that
--    want to map results.
-- ============================================================

-- 1. Enable PostGIS (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Geography column
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS coordinates geography(Point, 4326);

-- Backfill from latitude/longitude where present
UPDATE public.car_listings
   SET coordinates = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
 WHERE coordinates IS NULL
   AND latitude  IS NOT NULL
   AND longitude IS NOT NULL;

-- 3. GIST spatial index
CREATE INDEX IF NOT EXISTS idx_car_listings_coordinates
  ON public.car_listings USING GIST (coordinates);

-- 4. Trigger: keep coordinates in sync whenever lat/lng are updated.
--    Avoids exposing a writable PostGIS column to API clients.
CREATE OR REPLACE FUNCTION public.set_listing_coordinates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.coordinates := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.coordinates := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_set_coordinates ON public.car_listings;
CREATE TRIGGER car_listings_set_coordinates
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listing_coordinates();

-- 5. Replace the Haversine RPC with ST_DWithin — orders of magnitude faster
--    on indexed GEOGRAPHY columns.
DROP FUNCTION IF EXISTS public.listings_within_radius(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.listings_within_radius(
  user_lat  double precision,
  user_lng  double precision,
  radius_km double precision
)
RETURNS TABLE (
  listing_id  uuid,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  WITH origin AS (
    SELECT ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography AS g
  )
  SELECT
    cl.id AS listing_id,
    (ST_Distance(cl.coordinates, o.g) / 1000.0)::double precision AS distance_km
  FROM public.car_listings cl, origin o
  WHERE cl.status = 'approved'
    AND cl.coordinates IS NOT NULL
    AND ST_DWithin(cl.coordinates, o.g, radius_km * 1000.0)
  ORDER BY cl.coordinates <-> o.g
$$;

-- 6. Refresh the public view so coordinates are accessible for client maps
DROP VIEW IF EXISTS public.car_listings_public;
CREATE VIEW public.car_listings_public
WITH (security_invoker = true)
AS SELECT
    id, brand, model, year, price, mileage, fuel_type, transmission,
    body_type, color, euro_norm, description, features, photos,
    power, doors,
    car_pass_verified, car_pass_status,
    ct_valid, maintenance_book_complete,
    first_registration, location, latitude, longitude,
    seller_type, status, created_at, updated_at,
    boost_level, boost_expires_at,
    reference_url
FROM public.car_listings
WHERE status = 'approved'
  AND (car_pass_status = 'verified' OR seller_type = 'professionnel');

GRANT SELECT ON public.car_listings_public TO anon, authenticated;
