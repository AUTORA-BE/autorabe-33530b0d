CREATE OR REPLACE FUNCTION public.admin_get_user_emails(_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT u.id AS user_id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(_user_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_emails(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_user_emails(uuid[]) TO authenticated;