
-- FIX 1: ON DELETE CASCADE on dealer_verification_queue.user_id (RGPD)
ALTER TABLE public.dealer_verification_queue
  DROP CONSTRAINT IF EXISTS dealer_verification_queue_user_id_fkey;
ALTER TABLE public.dealer_verification_queue
  ADD CONSTRAINT dealer_verification_queue_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- FIX 2: Move profile + queue setup into handle_new_user_profile trigger
-- so it runs with elevated privileges, bypassing the no-session-after-signup RLS gap.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _user_type text := COALESCE(NULLIF(_meta->>'user_type',''), 'particulier');
  _garage_name text := NULLIF(_meta->>'garage_name','');
  _bce text := NULLIF(_meta->>'bce_number','');
  _phone text := NULLIF(_meta->>'phone','');
  _postal text := NULLIF(_meta->>'postal_code','');
  _full_name text := COALESCE(_meta->>'full_name', NEW.email);
BEGIN
  IF _user_type NOT IN ('particulier','professionnel') THEN
    _user_type := 'particulier';
  END IF;

  INSERT INTO public.profiles (
    user_id, display_name, user_type, garage_name, bce_number, phone, postal_code
  ) VALUES (
    NEW.id, _full_name, _user_type,
    CASE WHEN _user_type = 'professionnel' THEN _garage_name ELSE NULL END,
    CASE WHEN _user_type = 'professionnel' THEN _bce ELSE NULL END,
    _phone, _postal
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    user_type = EXCLUDED.user_type,
    garage_name = EXCLUDED.garage_name,
    bce_number = EXCLUDED.bce_number,
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    postal_code = COALESCE(public.profiles.postal_code, EXCLUDED.postal_code);

  IF _user_type = 'professionnel' THEN
    INSERT INTO public.dealer_verification_queue (
      user_id, status, garage_name_snapshot, bce_snapshot
    ) VALUES (NEW.id, 'pending', _garage_name, _bce)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- FIX 3: Drop redundant case-sensitive unique constraint on vitrine_slug
-- (the case-insensitive unique index profiles_vitrine_slug_unique remains the source of truth).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vitrine_slug_key;
DROP INDEX IF EXISTS public.idx_profiles_vitrine_slug;
