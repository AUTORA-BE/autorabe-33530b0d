DROP FUNCTION IF EXISTS public.admin_list_listings_with_contacts(integer);

CREATE FUNCTION public.admin_list_listings_with_contacts(_limit integer DEFAULT 500)
RETURNS TABLE(
  id uuid, user_id uuid, brand text, model text, year integer, price integer,
  mileage integer, fuel_type text, transmission text, location text, photos text[],
  contact_name text, contact_email text, contact_phone text,
  created_at timestamp with time zone, status text, seller_type text,
  description text, euro_norm text, boost_level text,
  boost_expires_at timestamp with time zone, boost_rank integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
         cl.fuel_type, cl.transmission, cl.location, cl.photos,
         cl.contact_name, cl.contact_email, cl.contact_phone,
         cl.created_at, cl.status, cl.seller_type, cl.description,
         cl.euro_norm, cl.boost_level, cl.boost_expires_at, cl.boost_rank::integer
  FROM public.car_listings cl
  ORDER BY cl.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 5000));
END;
$$;

GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO anon;
GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO service_role;