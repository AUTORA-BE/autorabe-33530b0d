-- ============================================================
-- Task 4 — Storage hardening for vehicle-photos & car-pass buckets
-- ----------------------------------------------------------------
-- 1. Set bucket-level limits (size + mime). Supabase enforces these on
--    the storage API layer regardless of policies, so this is the
--    safest spot to whitelist.
-- 2. Tighten the INSERT policy to also check mime + size.
--    (Defense in depth: policy fires after the bucket constraint.)
-- ============================================================

-- 1. vehicle-photos: public read, JPEG/PNG/WEBP, 10 MB max
UPDATE storage.buckets
   SET file_size_limit     = 10 * 1024 * 1024,           -- 10 MiB
       allowed_mime_types  = ARRAY['image/jpeg','image/png','image/webp']
 WHERE id = 'vehicle-photos';

-- 2. car-pass: private (signed URLs only), PDF/JPEG/PNG, 10 MB max
UPDATE storage.buckets
   SET file_size_limit    = 10 * 1024 * 1024,
       allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png'],
       public             = false
 WHERE id = 'car-pass';

-- 3. Drop & recreate the vehicle-photos INSERT policy with extra checks.
--    storage.objects.metadata->>'mimetype' is set by the storage API at upload.
DROP POLICY IF EXISTS "Users can upload vehicle photos" ON storage.objects;
CREATE POLICY "Users can upload vehicle photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (metadata->>'mimetype') IN ('image/jpeg','image/png','image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 10 * 1024 * 1024
  );

-- 4. Tighten public SELECT — only allow listing files inside identifiable
--    user folders (prevents directory listing & odd path traversal).
DROP POLICY IF EXISTS "Vehicle photos are publicly accessible" ON storage.objects;
CREATE POLICY "Vehicle photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- 5. car-pass INSERT policy: same auth-folder rule + mime/size constraints
DROP POLICY IF EXISTS "Users can upload car-pass" ON storage.objects;
CREATE POLICY "Users can upload car-pass"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-pass'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (metadata->>'mimetype') IN ('application/pdf','image/jpeg','image/png')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 10 * 1024 * 1024
  );
