ALTER VIEW public.car_listings_public SET (security_invoker = false);

CREATE OR REPLACE FUNCTION public.get_seller_contact(listing_id uuid)
RETURNS TABLE(contact_name text, contact_phone text, contact_email text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _allowed boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  SELECT public.check_rate_limit('get_seller_contact:' || _uid::text, 30, 3600) INTO _allowed;
  IF _allowed IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cl.contact_name,
    CASE
      WHEN cl.user_id = _uid
        OR public.has_role(_uid, 'admin'::app_role)
        OR public.has_conversation_with_listing(cl.id, _uid)
      THEN cl.contact_phone
    END,
    CASE
      WHEN cl.user_id = _uid
        OR public.has_role(_uid, 'admin'::app_role)
        OR public.has_conversation_with_listing(cl.id, _uid)
      THEN cl.contact_email
    END,
    cl.user_id
  FROM public.car_listings cl
  WHERE cl.id = listing_id
    AND cl.status = 'approved';
END;
$function$;