DROP POLICY IF EXISTS "Car-Pass documents are publicly accessible" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can view approved listings" ON public.car_listings;

CREATE OR REPLACE FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE car_listing_id = _listing_id
      AND (buyer_id = _user_id OR seller_id = _user_id)
  )
$$;

DROP VIEW IF EXISTS public.car_listings_public CASCADE;

CREATE VIEW public.car_listings_public AS
SELECT
  id, user_id, brand, model, year, price, mileage,
  fuel_type, transmission, body_type, color, power, doors, euro_norm,
  car_pass_verified, first_registration, description, features, photos,
  location, status, created_at, updated_at, ct_valid,
  maintenance_book_complete, seller_type, tva_number,
  boost_level, boost_expires_at, search_vector,
  car_pass_url, car_pass_date
FROM public.car_listings
WHERE status = 'approved';

GRANT SELECT ON public.car_listings_public TO anon, authenticated;

CREATE POLICY "Buyers in conversation can view full listing"
ON public.car_listings FOR SELECT TO authenticated
USING (
  status = 'approved'
  AND public.has_conversation_with_listing(id, auth.uid())
);

CREATE OR REPLACE FUNCTION public.get_public_listing(_listing_id uuid)
RETURNS TABLE (
  id uuid, user_id uuid, brand text, model text, year integer, price integer,
  mileage integer, fuel_type text, transmission text, body_type text, color text,
  power integer, doors integer, euro_norm text, car_pass_verified boolean,
  first_registration date, description text, features text[], photos text[],
  location text, status text, created_at timestamptz, updated_at timestamptz,
  ct_valid boolean, maintenance_book_complete boolean, seller_type text,
  tva_number text, boost_level text, boost_expires_at timestamptz,
  car_pass_url text, car_pass_date date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.body_type, cl.color, cl.power, cl.doors,
    cl.euro_norm, cl.car_pass_verified, cl.first_registration, cl.description,
    cl.features, cl.photos, cl.location, cl.status, cl.created_at, cl.updated_at,
    cl.ct_valid, cl.maintenance_book_complete, cl.seller_type, cl.tva_number,
    cl.boost_level, cl.boost_expires_at, cl.car_pass_url, cl.car_pass_date
  FROM public.car_listings cl
  WHERE cl.id = _listing_id AND cl.status = 'approved'
$$;

GRANT EXECUTE ON FUNCTION public.get_public_listing(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_conversation_with_listing(uuid, uuid) TO authenticated;