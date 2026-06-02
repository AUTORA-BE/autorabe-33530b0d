
-- 1. Colonnes vitrine sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vitrine_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS vitrine_cover_url text,
  ADD COLUMN IF NOT EXISTS vitrine_about text,
  ADD COLUMN IF NOT EXISTS vitrine_services text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vitrine_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vitrine_phone text,
  ADD COLUMN IF NOT EXISTS vitrine_email_public text;

-- Contraintes
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vitrine_slug_format,
  ADD CONSTRAINT profiles_vitrine_slug_format
    CHECK (vitrine_slug IS NULL OR vitrine_slug ~ '^[a-z0-9-]{3,60}$');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vitrine_about_length,
  ADD CONSTRAINT profiles_vitrine_about_length
    CHECK (vitrine_about IS NULL OR char_length(vitrine_about) <= 2000);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vitrine_services_max,
  ADD CONSTRAINT profiles_vitrine_services_max
    CHECK (array_length(vitrine_services, 1) IS NULL OR array_length(vitrine_services, 1) <= 10);

CREATE INDEX IF NOT EXISTS idx_profiles_vitrine_slug ON public.profiles(vitrine_slug) WHERE vitrine_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_vitrine_published ON public.profiles(vitrine_published) WHERE vitrine_published = true;

-- 2. RPC publique pour récupérer une vitrine publiée (par slug ou par user_id)
CREATE OR REPLACE FUNCTION public.get_public_vitrine(_slug_or_user text)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  garage_name text,
  avatar_url text,
  postal_code text,
  vitrine_slug text,
  vitrine_cover_url text,
  vitrine_about text,
  vitrine_services text[],
  vitrine_phone text,
  vitrine_email_public text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services,
         p.vitrine_phone, p.vitrine_email_public
  FROM public.profiles p
  WHERE p.vitrine_published = true
    AND (
      p.vitrine_slug = _slug_or_user
      OR p.user_id::text = _slug_or_user
    )
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_public_vitrine(text) TO anon, authenticated;

-- 3. RPC pour vérifier la disponibilité d'un slug (utilisé par EditVitrine)
CREATE OR REPLACE FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE vitrine_slug = _slug AND user_id <> _user_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_vitrine_slug_available(text, uuid) TO authenticated;

-- 4. Storage policies pour vitrine-covers/{user_id}/* dans le bucket avatars (public)
DROP POLICY IF EXISTS "Vitrine covers owner insert" ON storage.objects;
CREATE POLICY "Vitrine covers owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'vitrine-covers'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Vitrine covers owner update" ON storage.objects;
CREATE POLICY "Vitrine covers owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'vitrine-covers'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Vitrine covers owner delete" ON storage.objects;
CREATE POLICY "Vitrine covers owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'vitrine-covers'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
