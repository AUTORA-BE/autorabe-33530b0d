
-- Drop the restrictive owner-only policy that blocks public view access
DROP POLICY IF EXISTS "Users can only view their own listings" ON public.car_listings;

-- Re-create as PERMISSIVE: owners can see their own listings (any status)
CREATE POLICY "Owners can view their own listings"
ON public.car_listings
FOR SELECT
USING (auth.uid() = user_id);
