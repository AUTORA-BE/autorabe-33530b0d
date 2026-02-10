
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view approved listings" ON public.car_listings;

-- Create a restrictive policy: users can ONLY see their own listings
-- Public access goes through car_listings_public view (which excludes sensitive fields)
CREATE POLICY "Users can only view their own listings"
ON public.car_listings
FOR SELECT
USING (auth.uid() = user_id);
