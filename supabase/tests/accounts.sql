-- Run after the account-completion migration. Every test record is rolled back.
begin;
do $$
declare
  guest uuid := gen_random_uuid(); member uuid := gen_random_uuid(); other_member uuid := gen_random_uuid();
  saved uuid; tracked uuid; result jsonb;
begin
  if has_function_privilege('authenticated', 'public.claim_guest_data(uuid,uuid)', 'execute')
     or has_function_privilege('anon', 'public.claim_guest_data(uuid,uuid)', 'execute') then
    raise exception 'FAIL: claim RPC exposed to browser roles';
  end if;
  insert into auth.users(id, email, is_anonymous) values (guest, '', true), (member, 'claim-test-' || member || '@example.invalid', false), (other_member, 'claim-test-' || other_member || '@example.invalid', false);
  insert into public.tanks(user_id, name, length_cm, width_cm, height_cm) values (guest, 'Account regression test', 60, 30, 30) returning id into saved;
  insert into public.tracked_tanks(user_id, name) values (guest, 'Account regression tracker') returning id into tracked;
  insert into public.water_tests(user_id, tank_id, tested_on) values (guest, tracked, current_date);

  result := public.claim_guest_data(guest, member);
  if (result->>'claimed')::integer <> 3 then raise exception 'FAIL: did not move all three record types'; end if;
  if not exists(select 1 from public.tanks where id=saved and user_id=member)
     or not exists(select 1 from public.tracked_tanks where id=tracked and user_id=member)
     or not exists(select 1 from public.water_tests where tank_id=tracked and user_id=member) then
    raise exception 'FAIL: ownership mismatch';
  end if;
  result := public.claim_guest_data(guest, member);
  if result->>'status' <> 'account_has_data' then raise exception 'FAIL: retry must not overwrite'; end if;
  result := public.claim_guest_data(guest, other_member);
  if (result->>'claimed')::integer <> 0 then raise exception 'FAIL: transferred data twice'; end if;
  begin
    perform public.claim_guest_data(member, other_member);
    raise exception 'FAIL: member source accepted';
  exception when others then
    if sqlerrm <> 'The guest session could not be verified.' then raise; end if;
  end;
  begin
    perform public.claim_guest_data(guest, gen_random_uuid());
    raise exception 'FAIL: missing destination accepted';
  exception when others then
    if sqlerrm <> 'Sign in before moving guest tanks.' then raise; end if;
  end;
end;
$$;
rollback;
