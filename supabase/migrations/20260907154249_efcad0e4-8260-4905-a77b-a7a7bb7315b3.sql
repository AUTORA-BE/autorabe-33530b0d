create or replace function public.verify_cron_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_secret text;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_shared_token';
  if v_secret is null then
    return false;
  end if;
  return p_token = v_secret;
end;
$$;

revoke all on function public.verify_cron_token(text) from public, anon, authenticated;
grant execute on function public.verify_cron_token(text) to service_role;