
-- 1) car_listings: drop public SELECT policy (public uses car_listings_public view + RPCs)
DROP POLICY IF EXISTS "Public can view approved listings" ON public.car_listings;

-- 2) reviews: hide user_id from anon (column-level revoke)
REVOKE SELECT (user_id) ON public.reviews FROM anon;

-- 3) vitrine-covers storage policies: fix bucket id + add SELECT
DROP POLICY IF EXISTS "Vitrine covers owner insert" ON storage.objects;
DROP POLICY IF EXISTS "Vitrine covers owner update" ON storage.objects;
DROP POLICY IF EXISTS "Vitrine covers owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Vitrine covers owner select" ON storage.objects;

CREATE POLICY "Vitrine covers owner select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vitrine-covers'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Vitrine covers owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vitrine-covers'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Vitrine covers owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vitrine-covers'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'vitrine-covers'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Vitrine covers owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vitrine-covers'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
