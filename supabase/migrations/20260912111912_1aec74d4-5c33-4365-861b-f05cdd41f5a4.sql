-- Les fonctions internes ne sont appelees que par le trigger et par
-- get_daily_message_quota() (SECURITY DEFINER) : aucun role client n'en a besoin.
-- Le REVOKE ... FROM PUBLIC seul est inoperant ici, les default privileges de
-- Supabase accordant EXECUTE nommement a anon et authenticated.
REVOKE EXECUTE ON FUNCTION public.daily_message_limit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_daily_message_limit() FROM PUBLIC, anon, authenticated;

-- Le quota du jour ne concerne qu'un utilisateur connecte.
REVOKE EXECUTE ON FUNCTION public.get_daily_message_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_message_quota() TO authenticated;