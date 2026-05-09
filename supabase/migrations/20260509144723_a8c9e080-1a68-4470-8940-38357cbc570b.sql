-- Allow admins to read processed Stripe webhook events for monitoring
CREATE POLICY "Admins can view stripe webhook events"
ON public.stripe_processed_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));