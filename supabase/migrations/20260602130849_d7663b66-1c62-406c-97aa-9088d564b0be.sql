-- 1. Normalize existing slugs (lowercase, trim, strip invalid chars) before adding constraints
UPDATE public.profiles
SET vitrine_slug = NULLIF(regexp_replace(lower(trim(vitrine_slug)), '[^a-z0-9-]', '', 'g'), '')
WHERE vitrine_slug IS NOT NULL;

-- 2. Clear slugs that are too short/long to satisfy the new check constraint
UPDATE public.profiles
SET vitrine_slug = NULL
WHERE vitrine_slug IS NOT NULL
  AND (length(vitrine_slug) < 3 OR length(vitrine_slug) > 60);

-- 3. Auto-unpublish any vitrine that lacks a valid slug
UPDATE public.profiles
SET vitrine_published = false
WHERE vitrine_published = true AND vitrine_slug IS NULL;

-- 4. Unique (case-insensitive) index on slug — prevents duplicates at the DB level
CREATE UNIQUE INDEX IF NOT EXISTS profiles_vitrine_slug_unique
  ON public.profiles ((lower(vitrine_slug)))
  WHERE vitrine_slug IS NOT NULL;

-- 5. Format check constraint (a-z, 0-9, -, length 3-60)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vitrine_slug_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vitrine_slug_format
  CHECK (vitrine_slug IS NULL OR vitrine_slug ~ '^[a-z0-9-]{3,60}$');

-- 6. Trigger: normalize slug + force vitrine_published = false when no valid slug
CREATE OR REPLACE FUNCTION public.normalize_vitrine_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Normalize: lowercase, trim, strip invalid chars
  IF NEW.vitrine_slug IS NOT NULL THEN
    NEW.vitrine_slug := NULLIF(
      regexp_replace(lower(trim(NEW.vitrine_slug)), '[^a-z0-9-]', '', 'g'),
      ''
    );
    -- If normalization left it too short/long, drop it (CHECK would block otherwise)
    IF NEW.vitrine_slug IS NOT NULL
       AND (length(NEW.vitrine_slug) < 3 OR length(NEW.vitrine_slug) > 60) THEN
      NEW.vitrine_slug := NULL;
    END IF;
  END IF;

  -- Cannot publish without a valid slug — force back to draft
  IF NEW.vitrine_published = true AND NEW.vitrine_slug IS NULL THEN
    NEW.vitrine_published := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_normalize_vitrine_slug ON public.profiles;
CREATE TRIGGER profiles_normalize_vitrine_slug
  BEFORE INSERT OR UPDATE OF vitrine_slug, vitrine_published ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_vitrine_slug();

-- 7. Update availability RPC to normalize input the same way before checking
CREATE OR REPLACE FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized text;
BEGIN
  _normalized := NULLIF(regexp_replace(lower(trim(coalesce(_slug, ''))), '[^a-z0-9-]', '', 'g'), '');
  -- Format invalid → not available
  IF _normalized IS NULL OR _normalized !~ '^[a-z0-9-]{3,60}$' THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(vitrine_slug) = _normalized
      AND user_id <> _user_id
  );
END;
$$;