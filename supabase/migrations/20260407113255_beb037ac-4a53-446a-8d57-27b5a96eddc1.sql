-- Add tsvector column for full-text search
ALTER TABLE public.car_listings ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(brand, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(model, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(color, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(body_type, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(fuel_type, '')), 'B')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_car_listings_search ON public.car_listings USING GIN (search_vector);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON public.car_listings (status);
CREATE INDEX IF NOT EXISTS idx_car_listings_brand ON public.car_listings (brand);
CREATE INDEX IF NOT EXISTS idx_car_listings_price ON public.car_listings (price);
CREATE INDEX IF NOT EXISTS idx_car_listings_year ON public.car_listings (year);
CREATE INDEX IF NOT EXISTS idx_car_listings_fuel_type ON public.car_listings (fuel_type);
CREATE INDEX IF NOT EXISTS idx_car_listings_created_at ON public.car_listings (created_at DESC);