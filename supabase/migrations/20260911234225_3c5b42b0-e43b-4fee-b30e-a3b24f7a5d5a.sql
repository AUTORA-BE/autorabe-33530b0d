CREATE OR REPLACE FUNCTION public.daily_message_limit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _slug text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 5;
  END IF;

  IF public.has_role(_user_id, 'admin'::public.app_role) THEN
    RETURN NULL;
  END IF;

  SELECT CASE s.product_id
           WHEN 'prod_VBzrk30V0HDldQ' THEN 'particulier'
           WHEN 'prod_UKno1VUDM4yfzP' THEN 'pro'
           WHEN 'prod_UKo0UuUbuB5vdq' THEN 'premium'
           ELSE s.product_id
         END
    INTO _slug
    FROM public.subscriptions s
   WHERE s.user_id = _user_id
     AND s.status IN ('active', 'trialing', 'past_due')
     AND (s.current_period_end IS NULL OR s.current_period_end > now())
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF _slug IN ('pro', 'premium') THEN
    RETURN NULL;
  END IF;
  IF _slug = 'particulier' THEN
    RETURN 100;
  END IF;
  RETURN 5;
END;
$function$;

COMMENT ON FUNCTION public.daily_message_limit(uuid) IS
  'Plafond quotidien de messages (NULL = illimite). Miroir de src/features/subscription/constants/tiers.ts : gratuit 5, particulier 100, pro/premium/admin illimite.';

REVOKE EXECUTE ON FUNCTION public.daily_message_limit(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.enforce_daily_message_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _limit integer;
  _count integer;
BEGIN
  _limit := public.daily_message_limit(NEW.sender_id);

  IF _limit IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.daily_message_counts AS d (user_id, message_date, count)
  VALUES (NEW.sender_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, message_date)
  DO UPDATE SET count = d.count + 1
  RETURNING d.count INTO _count;

  IF _count > _limit THEN
    RAISE EXCEPTION 'DAILY_MESSAGE_LIMIT_REACHED'
      USING ERRCODE = 'PT429', DETAIL = _limit::text;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_daily_message_limit ON public.messages;
CREATE TRIGGER trg_enforce_daily_message_limit
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_message_limit();

DROP POLICY IF EXISTS "Users can insert own message counts" ON public.daily_message_counts;
DROP POLICY IF EXISTS "Users can update own message counts" ON public.daily_message_counts;

CREATE OR REPLACE FUNCTION public.get_daily_message_quota()
RETURNS TABLE(limit_per_day integer, used integer, remaining integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT l.limit_per_day,
         u.used,
         CASE WHEN l.limit_per_day IS NULL THEN NULL
              ELSE greatest(0, l.limit_per_day - u.used) END
    FROM (SELECT public.daily_message_limit(auth.uid()) AS limit_per_day) l
   CROSS JOIN (
     SELECT COALESCE((SELECT c.count
                        FROM public.daily_message_counts c
                       WHERE c.user_id = auth.uid()
                         AND c.message_date = CURRENT_DATE), 0) AS used
   ) u
$function$;

COMMENT ON FUNCTION public.get_daily_message_quota() IS
  'Quota du jour de l utilisateur courant, pour l affichage. limit_per_day NULL = illimite.';

GRANT EXECUTE ON FUNCTION public.get_daily_message_quota() TO authenticated;