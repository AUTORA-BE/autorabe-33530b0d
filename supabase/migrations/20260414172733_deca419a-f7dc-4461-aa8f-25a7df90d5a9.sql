
-- Create a function to get listing popularity stats
CREATE OR REPLACE FUNCTION public.get_listing_popularity(listing_ids uuid[])
RETURNS TABLE(listing_id uuid, favorite_count bigint, view_count bigint, interaction_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id as listing_id,
    COALESCE(f.fav_count, 0) as favorite_count,
    COALESCE(v.view_count, 0) as view_count,
    COALESCE(f.fav_count, 0) + COALESCE(v.view_count, 0) as interaction_count
  FROM unnest(listing_ids) AS l(id)
  LEFT JOIN (
    SELECT car_listing_id, count(*) as fav_count
    FROM public.favorites
    GROUP BY car_listing_id
  ) f ON f.car_listing_id = l.id
  LEFT JOIN (
    SELECT car_listing_id, count(*) as view_count
    FROM public.car_views
    GROUP BY car_listing_id
  ) v ON v.car_listing_id = l.id
$$;
