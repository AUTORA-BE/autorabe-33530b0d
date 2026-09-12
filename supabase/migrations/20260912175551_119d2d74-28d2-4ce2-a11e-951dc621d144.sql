create or replace function public.apply_paid_boost(
  p_session_id text,
  p_listing_id uuid,
  p_level text,
  p_hours integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_marker  text;
  v_expires timestamptz;
begin
  if p_session_id is null or btrim(p_session_id) = ''
     or p_listing_id is null
     or p_level is null or p_level !~ '^boost_[0-9]+[hd]$'
     or p_hours is null or p_hours <= 0 or p_hours > 8760 then
    return jsonb_build_object('applied', false, 'reason', 'invalid_input');
  end if;

  v_marker := 'boost-reconcile:' || p_session_id;

  if not exists (select 1 from public.car_listings where id = p_listing_id) then
    return jsonb_build_object('applied', false, 'reason', 'listing_not_found');
  end if;

  begin
    insert into public.stripe_processed_events (event_id, event_type, payload_summary)
    values (
      v_marker,
      'boost.reconciled',
      jsonb_build_object(
        'session_id', p_session_id,
        'listing_id', p_listing_id,
        'boost_level', p_level,
        'boost_hours', p_hours
      )
    );
  exception when unique_violation then
    return jsonb_build_object('applied', false, 'reason', 'already_applied');
  end;

  v_expires := now() + make_interval(hours => p_hours);

  update public.car_listings
     set boost_level = p_level,
         boost_expires_at = v_expires,
         boost_warning_sent = false
   where id = p_listing_id;

  if not found then
    raise exception 'apply_paid_boost: annonce % disparue pendant la reconciliation', p_listing_id;
  end if;

  return jsonb_build_object('applied', true, 'reason', 'applied', 'boost_expires_at', v_expires);
end;
$$;

revoke all on function public.apply_paid_boost(text, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.apply_paid_boost(text, uuid, text, integer) to service_role;