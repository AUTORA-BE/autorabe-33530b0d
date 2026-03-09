
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS boost_level text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS boost_expires_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.car_listings.boost_level IS 'Boost tier: none, standard, premium, ultra';
COMMENT ON COLUMN public.car_listings.boost_expires_at IS 'When the boost expires (null = no active boost)';
