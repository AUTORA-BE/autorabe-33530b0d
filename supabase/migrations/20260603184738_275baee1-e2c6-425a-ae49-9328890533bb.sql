
DROP FUNCTION IF EXISTS public.get_seller_display(uuid);
DROP FUNCTION IF EXISTS public.get_public_vitrine(text);

CREATE FUNCTION public.get_seller_display(listing_id uuid)
RETURNS TABLE(user_id uuid, display_name text, garage_name text, user_type text, avatar_url text, vitrine_slug text, vitrine_published boolean, is_admin boolean)
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
         CASE WHEN public.is_vitrine_eligible(p.user_id) THEN p.vitrine_published ELSE false END,
         public.has_role(p.user_id, 'admin'::app_role)
  FROM public.car_listings cl
  JOIN public.profiles p ON p.user_id = cl.user_id
  WHERE cl.id = listing_id
    AND cl.status = 'approved'
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_seller_display(uuid) TO anon, authenticated, service_role;

CREATE FUNCTION public.get_public_vitrine(_slug_or_user text)
RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, postal_code text, vitrine_slug text, vitrine_cover_url text, vitrine_about text, vitrine_services text[], vitrine_phone text, vitrine_email_public text, is_admin boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services,
         p.vitrine_phone, p.vitrine_email_public,
         public.has_role(p.user_id, 'admin'::app_role)
  FROM public.profiles p
  WHERE (p.vitrine_slug = _slug_or_user OR p.user_id::text = _slug_or_user)
    AND public.is_vitrine_eligible(p.user_id)
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_public_vitrine(text) TO anon, authenticated, service_role;
