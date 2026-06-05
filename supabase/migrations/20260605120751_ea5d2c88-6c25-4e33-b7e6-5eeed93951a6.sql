-- Fix: reviews.user_id should not be readable by anonymous visitors.
-- Keep public read of review content but hide reviewer identity for anon.
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, car_listing_id, rating, comment, created_at, updated_at)
  ON public.reviews TO anon;
-- Authenticated users keep full row access (their RLS still applies).
GRANT SELECT ON public.reviews TO authenticated;

-- Fix: vitrine-covers bucket — public dealer pages need public read on covers.
CREATE POLICY "Vitrine covers public read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'vitrine-covers');