-- Storage policies for the private dealer-kyc bucket (idempotent)

DROP POLICY IF EXISTS "Dealer uploads own KYC doc" ON storage.objects;
CREATE POLICY "Dealer uploads own KYC doc"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dealer-kyc'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Dealer reads own KYC doc" ON storage.objects;
CREATE POLICY "Dealer reads own KYC doc"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dealer-kyc'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins read all KYC docs" ON storage.objects;
CREATE POLICY "Admins read all KYC docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dealer-kyc'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);