-- Allow admins to delete any car listing
CREATE POLICY "Admins can delete any listing"
ON public.car_listings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any car listing (for status changes etc.)
CREATE POLICY "Admins can update any listing"
ON public.car_listings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all listings (including pending/rejected)
CREATE POLICY "Admins can view all listings"
ON public.car_listings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));