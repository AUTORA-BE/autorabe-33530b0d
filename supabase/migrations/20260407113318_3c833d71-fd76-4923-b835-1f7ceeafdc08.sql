-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits (key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits (expires_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Atomic rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _max_attempts integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _current_count integer;
BEGIN
  -- Clean expired entries
  DELETE FROM rate_limits WHERE expires_at < _now;

  -- Try to get existing entry
  SELECT count INTO _current_count
  FROM rate_limits
  WHERE key = _key AND window_start + (_window_seconds || ' seconds')::interval > _now
  FOR UPDATE;

  IF _current_count IS NULL THEN
    -- New window
    INSERT INTO rate_limits (key, count, window_start, expires_at)
    VALUES (_key, 1, _now, _now + (_window_seconds || ' seconds')::interval);
    RETURN true;
  ELSIF _current_count < _max_attempts THEN
    -- Increment
    UPDATE rate_limits SET count = count + 1
    WHERE key = _key AND window_start + (_window_seconds || ' seconds')::interval > _now;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;