
DROP VIEW IF EXISTS public.car_listings_public;

CREATE VIEW public.car_listings_public AS
SELECT 
  id, brand, model, year, price, mileage, fuel_type, transmission,
  body_type, color, euro_norm, description, features, photos,
  power, doors, car_pass_verified, ct_valid, maintenance_book_complete,
  first_registration, location, seller_type, status, created_at, updated_at,
  boost_level, boost_expires_at
FROM public.car_listings
WHERE status = 'approved';
