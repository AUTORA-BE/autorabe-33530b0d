-- Remove the overly permissive anonymous SELECT policy on car_listings base table
DROP POLICY IF EXISTS "Anyone can view approved listings" ON public.car_listings;

-- Create a SECURITY DEFINER function to get public listings by seller
-- This avoids exposing sensitive columns while allowing seller profile pages to work
CREATE OR REPLACE FUNCTION public.get_seller_public_listings(_seller_id uuid)
RETURNS TABLE(
  id uuid,
  brand text,
  model text,
  year integer,
  price integer,
  mileage integer,
  fuel_type text,
  transmission text,
  photos text[],
  location text,
  created_at timestamptz,
  body_type text,
  color text,
  power integer,
  doors integer,
  euro_norm text,
  car_pass_verified boolean,
  description text,
  features text[],
  boost_level text,
  boost_expires_at timestamptz,
  seller_type text,
  first_registration date,
  ct_valid boolean,
  maintenance_book_complete boolean,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    cl.id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.photos, cl.location, cl.created_at,
    cl.body_type, cl.color, cl.power, cl.doors, cl.euro_norm,
    cl.car_pass_verified, cl.description, cl.features,
    cl.boost_level, cl.boost_expires_at, cl.seller_type,
    cl.first_registration, cl.ct_valid, cl.maintenance_book_complete,
    cl.status
  FROM public.car_listings cl
  WHERE cl.user_id = _seller_id
    AND cl.status = 'approved'
  ORDER BY cl.created_at DESC
$$;