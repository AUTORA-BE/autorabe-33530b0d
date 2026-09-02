CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF  NEW.user_type        IS DISTINCT FROM OLD.user_type
   OR NEW.garage_name      IS DISTINCT FROM OLD.garage_name
   OR NEW.bce_number       IS DISTINCT FROM OLD.bce_number
   OR NEW.suspended_at     IS DISTINCT FROM OLD.suspended_at
   OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
  THEN
    RAISE EXCEPTION 'privileged_profile_column_change_denied'
      USING ERRCODE = '42501',
            HINT = 'Statut professionnel et suspension sont reserves aux administrateurs.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_columns ON public.profiles;

CREATE TRIGGER trg_protect_privileged_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_profile_columns();