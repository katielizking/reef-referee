begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-photos','community-photos',true,5242880,array['image/jpeg','image/png','image/webp']);
create function public.community_can_upload() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from auth.users u join public.community_profiles p on p.id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and not u.is_anonymous)
  and not exists(select 1 from public.community_bans where user_id=auth.uid())
  and (select count(*) from storage.objects where bucket_id='community-photos' and (storage.foldername(name))[1]=auth.uid()::text)<50;
$$;
revoke all on function public.community_can_upload() from public;
grant execute on function public.community_can_upload() to authenticated;
create policy community_photo_upload on storage.objects for insert to authenticated with check(
  bucket_id='community-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.community_can_upload()
);
create policy community_photo_owner_read on storage.objects for select to authenticated using(
  bucket_id='community-photos' and ((storage.foldername(name))[1]=auth.uid()::text or public.community_is_moderator())
);
create policy community_photo_remove on storage.objects for delete to authenticated using(
  bucket_id='community-photos' and ((storage.foldername(name))[1]=auth.uid()::text or public.community_is_moderator())
);
create unique index community_handle_case_insensitive on public.community_profiles(lower(handle));
commit;
