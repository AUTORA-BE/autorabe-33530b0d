
CREATE OR REPLACE FUNCTION public.get_favorite_counts(listing_ids uuid[])
RETURNS TABLE(car_listing_id uuid, favorite_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.car_listing_id, count(*) as favorite_count
  FROM public.favorites f
  WHERE f.car_listing_id = ANY(listing_ids)
  GROUP BY f.car_listing_id
$$;
