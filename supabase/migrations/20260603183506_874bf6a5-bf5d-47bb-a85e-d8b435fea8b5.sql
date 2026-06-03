-- 1) Backfill vitrine_slug + publish for every existing profile.
--    Slug priority: existing slug → slugified garage_name → slugified display_name → user_id prefix.
WITH gen AS (
  SELECT
    p.user_id,
    COALESCE(
      NULLIF(p.vitrine_slug, ''),
      NULLIF(regexp_replace(lower(unaccent(coalesce(p.garage_name, ''))), '[^a-z0-9]+', '-', 'g'), ''),
      NULLIF(regexp_replace(lower(unaccent(coalesce(p.display_name, ''))), '[^a-z0-9]+', '-', 'g'), ''),
      'garage-' || substr(p.user_id::text, 1, 8)
    ) AS base
  FROM public.profiles p
)
UPDATE public.profiles p
SET vitrine_slug = trim(both '-' from gen.base),
    vitrine_published = true
FROM gen
WHERE p.user_id = gen.user_id
  AND (p.vitrine_slug IS NULL OR p.vitrine_slug = '' OR p.vitrine_published IS DISTINCT FROM true);

-- 2) Deduplicate any colliding slugs by appending a short user_id suffix.
WITH dups AS (
  SELECT user_id, vitrine_slug,
         row_number() OVER (PARTITION BY vitrine_slug ORDER BY created_at) AS rn
  FROM public.profiles
  WHERE vitrine_slug IS NOT NULL
)
UPDATE public.profiles p
SET vitrine_slug = p.vitrine_slug || '-' || substr(p.user_id::text, 1, 6)
FROM dups
WHERE p.user_id = dups.user_id AND dups.rn > 1;

-- 3) Trigger: auto-generate slug + publish on profile insert/update if missing.
CREATE OR REPLACE FUNCTION public.ensure_vitrine_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.vitrine_slug IS NULL OR NEW.vitrine_slug = '' THEN
    base := COALESCE(
      NULLIF(regexp_replace(lower(unaccent(coalesce(NEW.garage_name, ''))), '[^a-z0-9]+', '-', 'g'), ''),
      NULLIF(regexp_replace(lower(unaccent(coalesce(NEW.display_name, ''))), '[^a-z0-9]+', '-', 'g'), ''),
      'garage-' || substr(NEW.user_id::text, 1, 8)
    );
    base := trim(both '-' from base);
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE vitrine_slug = candidate AND user_id <> NEW.user_id) LOOP
      i := i + 1;
      candidate := base || '-' || i::text;
    END LOOP;
    NEW.vitrine_slug := candidate;
  END IF;
  IF NEW.vitrine_published IS NULL THEN
    NEW.vitrine_published := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_vitrine_slug ON public.profiles;
CREATE TRIGGER trg_ensure_vitrine_slug
BEFORE INSERT OR UPDATE OF garage_name, display_name, vitrine_slug
ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_vitrine_slug();

-- 4) Relax the public RPC: serve any seller's vitrine by slug or user_id,
--    regardless of vitrine_published (universal vitrine per seller).
CREATE OR REPLACE FUNCTION public.get_public_vitrine(_slug_or_user text)
RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, postal_code text, vitrine_slug text, vitrine_cover_url text, vitrine_about text, vitrine_services text[], vitrine_phone text, vitrine_email_public text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services,
         p.vitrine_phone, p.vitrine_email_public
  FROM public.profiles p
  WHERE p.vitrine_slug = _slug_or_user
     OR p.user_id::text = _slug_or_user
  LIMIT 1
$function$;