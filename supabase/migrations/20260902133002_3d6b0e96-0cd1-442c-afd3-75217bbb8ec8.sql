-- 1. Column-level SELECT grants (non-sensitive columns only, mirroring car_listings_public)
GRANT SELECT (
  id, user_id, brand, model, year, price, mileage, fuel_type, transmission,
  body_type, color, power, doors, euro_norm, car_pass_verified, car_pass_status,
  car_pass_date, first_registration, description, features, photos, location,
  latitude, longitude, status, created_at, updated_at, ct_valid,
  maintenance_book_complete, seller_type, tva_number, boost_level,
  boost_expires_at, boost_rank, reference_url, fuel_consumption, co2, co2_cycle,
  mma, puissance_cv
) ON public.car_listings TO anon, authenticated;

-- 2. RLS SELECT policy for public approved listings
DROP POLICY IF EXISTS "Public can read approved listings" ON public.car_listings;
CREATE POLICY "Public can read approved listings"
  ON public.car_listings FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- 3. Make the view respect RLS
ALTER VIEW public.car_listings_public SET (security_invoker = true);
