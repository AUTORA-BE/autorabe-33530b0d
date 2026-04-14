-- Drop the existing overly permissive INSERT policy on chat-images
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;

-- Re-create with proper user-scoped path check
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);