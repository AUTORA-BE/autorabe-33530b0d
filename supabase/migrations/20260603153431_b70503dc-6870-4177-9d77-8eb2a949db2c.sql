
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.slugify_garage_name(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(
        trim(BOTH '-' FROM regexp_replace(
          lower(public.unaccent(coalesce(_input, ''))),
          '[^a-z0-9]+', '-', 'g'
        )),
        '-{2,}', '-', 'g'
      ),
      '^(.{1,60}).*$', '\1'
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_vitrine_slug(_desired text, _user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base text;
  _candidate text;
  _suffix int := 0;
BEGIN
  _base := public.slugify_garage_name(_desired);
  IF _base IS NULL OR length(_base) < 3 THEN
    SELECT public.slugify_garage_name(coalesce(garage_name, display_name, ''))
      INTO _base
    FROM public.profiles
    WHERE user_id = _user_id;
  END IF;
  IF _base IS NULL OR length(_base) < 3 THEN
    _base := 'garage-' || substr(_user_id::text, 1, 8);
  END IF;

  _candidate := _base;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(vitrine_slug) = _candidate
      AND user_id <> _user_id
  ) LOOP
    _suffix := _suffix + 1;
    _candidate := left(_base, 60 - length(_suffix::text) - 1) || '-' || _suffix::text;
  END LOOP;

  RETURN _candidate;
END;
$$;

GRANT EXECUTE ON FUNCTION public.slugify_garage_name(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_vitrine_slug(text, uuid) TO authenticated;
