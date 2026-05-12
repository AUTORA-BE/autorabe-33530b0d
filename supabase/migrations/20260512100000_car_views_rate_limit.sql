-- M4: Prevent view spam — 1 view per IP hash per listing per hour.
-- Uses a BEFORE INSERT trigger that raises an exception when the rate limit is exceeded.
-- The client (useCarView hook) swallows the error silently so the page still loads.

CREATE OR REPLACE FUNCTION public.enforce_car_view_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ip_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.car_views
    WHERE car_listing_id = NEW.car_listing_id
      AND ip_hash = NEW.ip_hash
      AND viewed_at > NOW() - INTERVAL '1 hour'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_car_views_rate_limit ON public.car_views;

CREATE TRIGGER trg_car_views_rate_limit
  BEFORE INSERT ON public.car_views
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_car_view_rate_limit();

-- Composite index for fast rate-limit check
CREATE INDEX IF NOT EXISTS idx_car_views_ip_listing_time
  ON public.car_views (car_listing_id, ip_hash, viewed_at DESC)
  WHERE ip_hash IS NOT NULL;
