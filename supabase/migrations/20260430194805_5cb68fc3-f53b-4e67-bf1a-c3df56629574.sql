-- 1) RLS: allow users to read their own views
CREATE POLICY "Users can view their own car views"
ON public.car_views
FOR SELECT
TO authenticated
USING (viewer_id = auth.uid());

-- 2) RLS: allow users to delete their own views
CREATE POLICY "Users can delete their own car views"
ON public.car_views
FOR DELETE
TO authenticated
USING (viewer_id = auth.uid());

-- 3) Performance index for history queries
CREATE INDEX IF NOT EXISTS idx_car_views_viewer_viewed_at
ON public.car_views (viewer_id, viewed_at DESC)
WHERE viewer_id IS NOT NULL;

-- 4) RPC: get_user_view_history — deduped recent views with full listing data
CREATE OR REPLACE FUNCTION public.get_user_view_history(_limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  brand text,
  model text,
  year integer,
  price integer,
  mileage integer,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  power integer,
  doors integer,
  euro_norm text,
  car_pass_verified boolean,
  first_registration date,
  description text,
  features text[],
  photos text[],
  location text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ct_valid boolean,
  maintenance_book_complete boolean,
  seller_type text,
  boost_level text,
  boost_expires_at timestamp with time zone,
  last_viewed_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH last_views AS (
    SELECT DISTINCT ON (cv.car_listing_id)
      cv.car_listing_id,
      cv.viewed_at
    FROM public.car_views cv
    WHERE cv.viewer_id = auth.uid()
    ORDER BY cv.car_listing_id, cv.viewed_at DESC
  )
  SELECT
    cl.id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.body_type, cl.color,
    cl.power, cl.doors, cl.euro_norm, cl.car_pass_verified,
    cl.first_registration, cl.description, cl.features, cl.photos,
    cl.location, cl.status, cl.created_at, cl.updated_at,
    cl.ct_valid, cl.maintenance_book_complete, cl.seller_type,
    cl.boost_level, cl.boost_expires_at,
    lv.viewed_at AS last_viewed_at
  FROM last_views lv
  JOIN public.car_listings cl ON cl.id = lv.car_listing_id
  WHERE cl.status = 'approved'
    AND auth.uid() IS NOT NULL
  ORDER BY lv.viewed_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_view_history(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_view_history(integer) TO authenticated;

-- 5) RPC: clear_user_view_history
CREATE OR REPLACE FUNCTION public.clear_user_view_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  WITH deleted AS (
    DELETE FROM public.car_views
    WHERE viewer_id = auth.uid()
    RETURNING 1
  )
  SELECT COUNT(*)::integer INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.clear_user_view_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_user_view_history() TO authenticated;