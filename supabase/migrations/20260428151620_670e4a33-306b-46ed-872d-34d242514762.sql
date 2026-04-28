-- Fix Security Definer View ERROR: enforce security_invoker on car_listings_public
-- so the view runs with the querying user's permissions and respects RLS on car_listings.
ALTER VIEW public.car_listings_public SET (security_invoker = true);