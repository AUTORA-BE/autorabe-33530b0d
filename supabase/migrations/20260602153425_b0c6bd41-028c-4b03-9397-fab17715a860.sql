
-- =========================================================
-- 1. dealer_events : journal minimal (sans PII)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.dealer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'pro_signup',
    'dealer_approved',
    'dealer_rejected',
    'trigger_error'
  )),
  user_id uuid,
  queue_id uuid,
  actor_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dealer_events_created_at
  ON public.dealer_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dealer_events_user
  ON public.dealer_events (user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_events_type
  ON public.dealer_events (event_type);

GRANT SELECT, INSERT ON public.dealer_events TO authenticated;
GRANT ALL ON public.dealer_events TO service_role;
-- explicit : pas d'accès anon
REVOKE ALL ON public.dealer_events FROM anon;

ALTER TABLE public.dealer_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read dealer events" ON public.dealer_events;
CREATE POLICY "Admins read dealer events"
  ON public.dealer_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert dealer events" ON public.dealer_events;
CREATE POLICY "Admins insert dealer events"
  ON public.dealer_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND actor_id = auth.uid()
  );

-- (service_role bypass RLS automatiquement)

-- =========================================================
-- 2. Trigger renforcé : log + error capture
-- =========================================================
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
  END;

  RETURN NEW;
END;
$function$;

-- =========================================================
-- 3. Durcissement RLS dealer_verification_queue
-- =========================================================
REVOKE ALL ON public.dealer_verification_queue FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.dealer_verification_queue TO authenticated;
GRANT ALL ON public.dealer_verification_queue TO service_role;

-- Recrée explicitement la policy SELECT pour confirmer le périmètre
DROP POLICY IF EXISTS "Owner or admin can view queue" ON public.dealer_verification_queue;
CREATE POLICY "Owner or admin can view queue"
  ON public.dealer_verification_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can update queue" ON public.dealer_verification_queue;
CREATE POLICY "Admin can update queue"
  ON public.dealer_verification_queue FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "User can submit own request" ON public.dealer_verification_queue;
CREATE POLICY "User can submit own request"
  ON public.dealer_verification_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
