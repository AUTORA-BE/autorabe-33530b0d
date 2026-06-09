CREATE OR REPLACE FUNCTION public.admin_get_user_contact(_user_id uuid)
 RETURNS TABLE(user_id uuid, email text, display_name text, garage_name text, user_type text, phone text, postal_code text, avatar_url text, bce_number text, suspended_at timestamp with time zone, suspended_reason text, created_at timestamp with time zone, listing_count bigint, subscription_product_id text, subscription_status text, subscription_end timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.garage_name,
    p.user_type,
    p.phone,
    p.postal_code,
    p.avatar_url,
    p.bce_number,
    p.suspended_at,
    p.suspended_reason,
    p.created_at,
    COALESCE((SELECT count(*) FROM public.car_listings cl WHERE cl.user_id = p.user_id), 0)::bigint,
    s.product_id,
    s.status,
    s.current_period_end
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN LATERAL (
    SELECT sub.product_id, sub.status, sub.current_period_end
    FROM public.subscriptions sub
    WHERE sub.user_id = p.user_id
    ORDER BY (sub.status = 'active') DESC, sub.updated_at DESC
    LIMIT 1
  ) s ON true
  WHERE p.user_id = _user_id
  LIMIT 1;
END;
$function$;