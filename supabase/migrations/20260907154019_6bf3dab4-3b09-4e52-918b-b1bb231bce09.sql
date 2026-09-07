create or replace function public.__set_cron_vault_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'cron_service_role_key';
  if v_id is null then
    perform vault.create_secret(p_secret, 'cron_service_role_key', 'Jeton unique lu par les taches planifiees (expire-boosts, ops-alerts-digest)');
  else
    perform vault.update_secret(v_id, p_secret);
  end if;
end;
$$;

revoke all on function public.__set_cron_vault_secret(text) from public, anon, authenticated;
grant execute on function public.__set_cron_vault_secret(text) to sandbox_exec;