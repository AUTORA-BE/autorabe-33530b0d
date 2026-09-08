-- 1) Le téléphone est optionnel et non identifiant : deux index uniques doublons le rendaient bloquant.
DROP INDEX IF EXISTS public.profiles_phone_unique;
DROP INDEX IF EXISTS public.idx_profiles_phone_unique;
-- Aucun index de recherche sur phone n'est nécessaire : aucune requête ne filtre sur cette colonne.

-- 2) Les échecs du trigger restent non bloquants, mais deviennent visibles dans ops_alerts.
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
  _queue_id uuid;
BEGIN
  IF _user_type NOT IN ('particulier','professionnel') THEN
    _user_type := 'particulier';
  END IF;

  BEGIN
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
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id INTO _queue_id;

      -- Log non-PII : on stocke seulement des booléens et longueurs
      INSERT INTO public.dealer_events (event_type, user_id, queue_id, meta)
      VALUES (
        'pro_signup', NEW.id, _queue_id,
        jsonb_build_object(
          'has_garage_name', _garage_name IS NOT NULL,
          'has_bce', _bce IS NOT NULL,
          'has_phone', _phone IS NOT NULL,
          'postal_prefix', LEFT(COALESCE(_postal,''), 1)
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- On capture l'erreur sans bloquer la création auth
    INSERT INTO public.dealer_events (event_type, user_id, meta)
    VALUES (
      'trigger_error', NEW.id,
      jsonb_build_object(
        'sqlstate', SQLSTATE,
        'context', 'handle_new_user_profile',
        'user_type', _user_type
      )
    );

    -- Visibilité côté exploitation. Aucune donnée personnelle : code d'erreur et type de compte uniquement.
    INSERT INTO public.ops_alerts (source, severity, message, context)
    VALUES (
      'handle_new_user_profile',
      'error',
      'Profile creation failed during signup; auth account created without profile',
      jsonb_build_object('sqlstate', SQLSTATE, 'user_type', _user_type)
    );
  END;

  RETURN NEW;
END;
$function$;