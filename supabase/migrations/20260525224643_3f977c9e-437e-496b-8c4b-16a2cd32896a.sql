
-- 1. Reviews: hide reviewer user_id from anonymous visitors (keep for authenticated to allow ownership checks)
REVOKE SELECT (user_id) ON public.reviews FROM anon;

-- 2. Car-Pass: relax https-only constraint to allow storing relative storage object paths
ALTER TABLE public.car_listings DROP CONSTRAINT IF EXISTS car_pass_url_https_only;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_pass_url_safe
  CHECK (
    car_pass_url IS NULL
    OR car_pass_url ~* '^https://'
    OR car_pass_url ~ '^[A-Za-z0-9._/-]+$'
  );

-- 3. Backfill: convert any stored public/signed Supabase Storage URLs for the car-pass bucket
-- into bare object paths (so the app generates fresh signed URLs at read time).
UPDATE public.car_listings
SET car_pass_url = regexp_replace(
  car_pass_url,
  '^https?://[^/]+/storage/v1/object/(public|sign)/car-pass/',
  ''
)
WHERE car_pass_url ~ '/storage/v1/object/(public|sign)/car-pass/';
