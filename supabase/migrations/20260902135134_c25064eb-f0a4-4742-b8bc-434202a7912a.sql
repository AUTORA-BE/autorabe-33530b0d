CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_car_listings_location_trgm
  ON public.car_listings USING gin (location public.gin_trgm_ops);

CREATE OR REPLACE VIEW public.car_listings_public AS
SELECT id,
    user_id,
    brand,
    model,
    year,
    price,
    mileage,
    fuel_type,
    transmission,
    body_type,
    color,
    power,
    doors,
    euro_norm,
    car_pass_verified,
    car_pass_status,
    car_pass_date,
    first_registration,
    description,
    features,
    photos,
    location,
    round(latitude::numeric, 2)::double precision AS latitude,
    round(longitude::numeric, 2)::double precision AS longitude,
    status,
    created_at,
    updated_at,
    ct_valid,
    maintenance_book_complete,
    seller_type,
    tva_number,
    boost_level,
    boost_expires_at,
    boost_rank,
    reference_url,
    fuel_consumption,
    co2,
    co2_cycle,
    mma,
    puissance_cv
   FROM car_listings
  WHERE status = 'approved'::text;

ALTER VIEW public.car_listings_public SET (security_invoker = true);