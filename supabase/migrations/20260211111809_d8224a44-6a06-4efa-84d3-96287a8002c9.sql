
-- Allow public SELECT on approved listings only (the car_listings_public view filters sensitive columns)
-- This works WITH the owner-only policy since both are RESTRICTIVE, so we need a PERMISSIVE one
CREATE POLICY "Public can view approved listings via view"
ON public.car_listings
FOR SELECT
USING (status = 'approved');
