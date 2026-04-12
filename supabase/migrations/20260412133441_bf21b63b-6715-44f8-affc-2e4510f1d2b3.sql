
-- Add car_pass_url and car_pass_date columns to car_listings
ALTER TABLE public.car_listings
ADD COLUMN IF NOT EXISTS car_pass_url text,
ADD COLUMN IF NOT EXISTS car_pass_date date;

-- Create the car-pass storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-pass', 'car-pass', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Car-Pass documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-pass');

-- Users can upload their own Car-Pass
CREATE POLICY "Users can upload car-pass documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-pass' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own Car-Pass
CREATE POLICY "Users can delete car-pass documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-pass' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own Car-Pass
CREATE POLICY "Users can update car-pass documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-pass' AND auth.uid()::text = (storage.foldername(name))[1]);
