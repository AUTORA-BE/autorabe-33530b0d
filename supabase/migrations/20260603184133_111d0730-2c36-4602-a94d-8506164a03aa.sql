
-- Eligibility helper
CREATE OR REPLACE FUNCTION public.is_vitrine_eligible(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND (
      public.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.user_id = _user_id
          AND s.status = 'active'
          AND s.product_id IN (
            'prod_UKno1VUDM4yfzP', -- Pro Garage
            'prod_UKo0UuUbuB5vdq'  -- Premium
          )
          AND (s.current_period_end IS NULL OR s.current_period_end > now())
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_vitrine_eligible(uuid) TO anon, authenticated, service_role;

-- Public vitrine RPC: only return eligible storefronts
CREATE OR REPLACE FUNCTION public.get_public_vitrine(_slug_or_user text)
RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, postal_code text, vitrine_slug text, vitrine_cover_url text, vitrine_about text, vitrine_services text[], vitrine_phone text, vitrine_email_public text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services,
         p.vitrine_phone, p.vitrine_email_public
  FROM public.profiles p
  WHERE (p.vitrine_slug = _slug_or_user OR p.user_id::text = _slug_or_user)
    AND public.is_vitrine_eligible(p.user_id)
  LIMIT 1
$$;

-- Seller display used on vehicle pages: hide vitrine_slug if not eligible
CREATE OR REPLACE FUNCTION public.get_seller_display(listing_id uuid)
RETURNS TABLE(user_id uuid, display_name text, garage_name text, user_type text, avatar_url text, vitrine_slug text, vitrine_published boolean)
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
         CASE WHEN public.is_vitrine_eligible(p.user_id) THEN p.vitrine_slug ELSE NULL END,
         CASE WHEN public.is_vitrine_eligible(p.user_id) THEN p.vitrine_published ELSE false END
  FROM public.car_listings cl
  JOIN public.profiles p ON p.user_id = cl.user_id
  WHERE cl.id = listing_id
    AND cl.status = 'approved'
  LIMIT 1
$$;

-- Restrict public garage search to eligible vitrines as well
CREATE OR REPLACE FUNCTION public.search_public_vitrines(_q text DEFAULT NULL, _city text DEFAULT NULL, _limit integer DEFAULT 60)
RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, postal_code text, vitrine_slug text, vitrine_cover_url text, vitrine_about text, vitrine_services text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services
  FROM public.profiles p
  WHERE p.vitrine_published = true
    AND p.user_type = 'professionnel'
    AND p.vitrine_slug IS NOT NULL
    AND public.is_vitrine_eligible(p.user_id)
    AND (
      _q IS NULL OR length(trim(_q)) = 0
      OR p.garage_name ILIKE '%' || _q || '%'
      OR p.display_name ILIKE '%' || _q || '%'
      OR p.vitrine_slug ILIKE '%' || _q || '%'
    )
    AND (
      _city IS NULL OR length(trim(_city)) = 0
      OR p.postal_code ILIKE _city || '%'
    )
  ORDER BY p.garage_name NULLS LAST, p.display_name
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;
