-- Allow anonymous + authenticated users to view approved listings (public marketplace)
DROP POLICY IF EXISTS "Public can view approved listings" ON public.car_listings;
CREATE POLICY "Public can view approved listings"
ON public.car_listings
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Ensure the public view is readable by the anon role
GRANT SELECT ON public.car_listings_public TO anon, authenticated;