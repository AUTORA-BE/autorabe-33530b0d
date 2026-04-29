-- Enable trigram extension for fast ILIKE / fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- 1. Default homepage sort: status='approved' + created_at DESC + boost
-- Partial index dramatically reduces size and speeds up the most common query
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_recent
  ON public.car_listings (boost_level DESC, created_at DESC, id)
  WHERE status = 'approved';

-- 2. Price sort on approved listings
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_price
  ON public.car_listings (boost_level DESC, price ASC, id)
  WHERE status = 'approved';

-- 3. Year sort on approved listings
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_year
  ON public.car_listings (boost_level DESC, year DESC, id)
  WHERE status = 'approved';

-- 4. Mileage sort on approved listings
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_mileage
  ON public.car_listings (boost_level DESC, mileage ASC, id)
  WHERE status = 'approved';

-- 5. Trigram indexes for ILIKE on brand & model (search box, brand/model filters)
CREATE INDEX IF NOT EXISTS idx_car_listings_brand_trgm
  ON public.car_listings USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_car_listings_model_trgm
  ON public.car_listings USING gin (model gin_trgm_ops);

-- 6. Trigram on location for province city matching
CREATE INDEX IF NOT EXISTS idx_car_listings_location_trgm
  ON public.car_listings USING gin (location gin_trgm_ops)
  WHERE location IS NOT NULL;

-- 7. Common single-column filters
CREATE INDEX IF NOT EXISTS idx_car_listings_seller_type
  ON public.car_listings (seller_type) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_car_listings_body_type
  ON public.car_listings (body_type) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_car_listings_euro_norm
  ON public.car_listings (euro_norm) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_car_listings_mileage
  ON public.car_listings (mileage) WHERE status = 'approved';

-- 8. Owner dashboard (seller's own listings page)
CREATE INDEX IF NOT EXISTS idx_car_listings_user_created
  ON public.car_listings (user_id, created_at DESC);

-- 9. Boost ordering helper (active boosts only)
CREATE INDEX IF NOT EXISTS idx_car_listings_active_boost
  ON public.car_listings (boost_level, boost_expires_at)
  WHERE status = 'approved' AND boost_level <> 'none';

-- Update planner statistics so new indexes are picked up immediately
ANALYZE public.car_listings;