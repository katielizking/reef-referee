-- Participation remains paused until an operator explicitly appoints a moderator.
begin;
create function public.community_is_ready() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.community_admin_emails);
$$;
revoke all on function public.community_is_ready() from public;
grant execute on function public.community_is_ready() to anon,authenticated;
alter function public.community_write(text,jsonb) rename to community_write_internal;
revoke all on function public.community_write_internal(text,jsonb) from public,anon,authenticated;
create function public.community_write(action text,payload jsonb default '{}'::jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
begin
  if not public.community_is_ready() then raise exception 'Community participation is not open yet. Please check back soon.'; end if;
  return public.community_write_internal(action,payload);
end;
$$;
revoke all on function public.community_write(text,jsonb) from public,anon;
grant execute on function public.community_write(text,jsonb) to authenticated;
create or replace function public.community_can_upload() returns boolean language sql stable security definer set search_path=public as $$
  select public.community_is_ready()
  and exists(select 1 from auth.users u join public.community_profiles p on p.id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and not u.is_anonymous)
  and not exists(select 1 from public.community_bans where user_id=auth.uid())
  and (select count(*) from storage.objects where bucket_id='community-photos' and (storage.foldername(name))[1]=auth.uid()::text)<50;
$$;
commit;
