CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_reviewers_profiles(_user_ids uuid[])
RETURNS TABLE (user_id uuid, display_name text, avatar_url text, is_admin boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, COALESCE(p.display_name, p.garage_name, 'Utilisateur'), p.avatar_url, public.is_admin_user(p.id)
  FROM public.profiles p WHERE p.id = ANY(_user_ids);
$$;
GRANT EXECUTE ON FUNCTION public.get_reviewers_profiles(uuid[]) TO anon, authenticated, service_role;