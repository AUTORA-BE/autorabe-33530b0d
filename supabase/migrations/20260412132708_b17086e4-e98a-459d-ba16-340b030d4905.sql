
-- Create the vehicle-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Vehicle photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

-- Users can upload their own photos (folder = user_id)
CREATE POLICY "Users can upload vehicle photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own photos
CREATE POLICY "Users can delete vehicle photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own photos
CREATE POLICY "Users can update vehicle photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
