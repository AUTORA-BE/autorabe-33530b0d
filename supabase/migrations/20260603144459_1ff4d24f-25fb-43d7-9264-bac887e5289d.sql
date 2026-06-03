CREATE OR REPLACE FUNCTION public.search_public_vitrines(_q text DEFAULT NULL, _city text DEFAULT NULL, _limit integer DEFAULT 60)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  garage_name text,
  avatar_url text,
  postal_code text,
  vitrine_slug text,
  vitrine_cover_url text,
  vitrine_about text,
  vitrine_services text[]
)
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

GRANT EXECUTE ON FUNCTION public.search_public_vitrines(text, text, integer) TO anon, authenticated;