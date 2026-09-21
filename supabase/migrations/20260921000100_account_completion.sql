-- Only the server may call this after verifying BOTH sessions with Auth.
-- All ownership changes succeed together, or none do.
begin;
create or replace function public.claim_guest_data(p_guest_id uuid, p_member_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare moved integer := 0; affected integer;
begin
  if p_guest_id = p_member_id then
    return jsonb_build_object('claimed', 0, 'status', 'same_account');
  end if;
  -- Lock identity rows in a stable order. Concurrent claims cannot split data.
  perform id from auth.users where id in (p_guest_id, p_member_id) order by id for update;
  if not exists(select 1 from auth.users where id = p_guest_id and is_anonymous and coalesce(email, '') = '') then
    raise exception 'The guest session could not be verified.';
  end if;
  if not exists(select 1 from auth.users where id = p_member_id and not is_anonymous) then
    raise exception 'Sign in before moving guest tanks.';
  end if;
  -- Serialise the empty-account check against inserts and other claims.
  lock table public.tanks, public.tracked_tanks, public.water_tests in share row exclusive mode;
  if exists(select 1 from public.tanks where user_id = p_member_id)
     or exists(select 1 from public.tracked_tanks where user_id = p_member_id)
     or exists(select 1 from public.water_tests where user_id = p_member_id) then
    return jsonb_build_object('claimed', 0, 'status', 'account_has_data');
  end if;
  update public.tanks set user_id = p_member_id where user_id = p_guest_id;
  get diagnostics affected = row_count; moved := moved + affected;
  update public.tracked_tanks set user_id = p_member_id where user_id = p_guest_id;
  get diagnostics affected = row_count; moved := moved + affected;
  update public.water_tests set user_id = p_member_id where user_id = p_guest_id;
  get diagnostics affected = row_count; moved := moved + affected;
  return jsonb_build_object('claimed', moved, 'status', 'complete');
end;
$$;
revoke all on function public.claim_guest_data(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_guest_data(uuid, uuid) to service_role;

-- Choosing a handle must not depend on the community posting launch switch.
-- The internal function still requires a confirmed member and enforces bans.
create or replace function public.community_write(action text, payload jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if action <> 'profile' and not public.community_is_ready() then
    raise exception 'Community participation is not open yet. Please check back soon.';
  end if;
  return public.community_write_internal(action, payload);
end;
$$;
revoke all on function public.community_write(text, jsonb) from public, anon;
grant execute on function public.community_write(text, jsonb) to authenticated;
commit;
