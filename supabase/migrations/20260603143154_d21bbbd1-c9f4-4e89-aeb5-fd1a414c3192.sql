-- Public RPC to fetch a seller's display name (garage_name for Pro, display_name for private)
-- Used on public listing pages to show the seller name without exposing private profile fields.
CREATE OR REPLACE FUNCTION public.get_seller_display(listing_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  garage_name text,
  user_type text,
  avatar_url text,
  vitrine_slug text,
  vitrine_published boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id,
         p.display_name,
         p.garage_name,
         p.user_type,
         p.avatar_url,
         p.vitrine_slug,
         p.vitrine_published
  FROM public.car_listings cl
  JOIN public.profiles p ON p.user_id = cl.user_id
  WHERE cl.id = listing_id
    AND cl.status = 'approved'
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_display(uuid) TO anon, authenticated;