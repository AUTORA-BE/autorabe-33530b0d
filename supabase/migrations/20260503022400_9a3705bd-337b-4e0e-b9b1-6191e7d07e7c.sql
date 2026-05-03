CREATE OR REPLACE FUNCTION public.get_active_cities_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT location)::integer
  FROM public.car_listings
  WHERE status = 'approved' AND location IS NOT NULL AND location <> '';
$$;

GRANT EXECUTE ON FUNCTION public.get_active_cities_count() TO anon, authenticated;