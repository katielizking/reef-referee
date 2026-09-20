-- Integration tests. Run as the database operator. Everything rolls back.
begin;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('00000000-0000-4000-a000-000000000001','community-test-one@example.invalid',now(),false),
 ('00000000-0000-4000-a000-000000000002','community-test-two@example.invalid',now(),false),
 ('00000000-0000-4000-a000-000000000003',null,null,true);
insert into public.community_admin_emails values('community-test-two@example.invalid');
set local role authenticated;
do $$
declare p uuid; c uuid; reply uuid; rejected boolean;
begin
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-a000-000000000003',true);
  rejected:=false;begin perform public.community_write('profile','{"handle":"GuestTest"}');exception when others then rejected:=true;end;
  assert rejected,'anonymous writer was accepted';
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-a000-000000000001',true);
  perform public.community_write('profile','{"handle":"TestKeeperOne"}');
  p:=public.community_write('post','{"title":"Integration test","body":"A temporary test post","flair":"General"}');
  perform set_config('test.post_id',p::text,true);
  c:=public.community_write('comment',jsonb_build_object('post_id',p,'body','First comment'));
  reply:=public.community_write('comment',jsonb_build_object('post_id',p,'parent_id',c,'body','Reply'));
  rejected:=false;begin perform public.community_write('comment',jsonb_build_object('post_id',p,'parent_id',reply,'body','Too deep'));exception when others then rejected:=true;end;
  assert rejected,'third-level reply accepted';
  rejected:=false;begin update public.community_posts set score=999 where id=p;exception when insufficient_privilege then rejected:=true;end;
  assert rejected,'direct counter update accepted';
  rejected:=false;begin perform public.community_write('hide',jsonb_build_object('post_id',p));exception when others then rejected:=true;end;
  assert rejected,'non-moderator hide accepted';
  rejected:=false;begin perform public.community_write('post','{"title":"Bad URL","link_url":"javascript:alert(1)"}');exception when others then rejected:=true;end;
  assert rejected,'unsafe URL accepted';
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-a000-000000000002',true);
  perform public.community_write('profile','{"handle":"TestKeeperTwo"}');
  perform public.community_write('vote',jsonb_build_object('post_id',p,'value',1));
  perform public.community_write('vote',jsonb_build_object('post_id',p,'value',1));
  assert (select score=1 from public.community_posts where id=p),'duplicate vote inflated score';
  perform public.community_write('vote',jsonb_build_object('post_id',p,'value',-1));
  assert (select score=-1 from public.community_posts where id=p),'vote switch incorrect';
  perform public.community_write('vote',jsonb_build_object('post_id',p,'value',0));
  assert (select score=0 from public.community_posts where id=p),'vote removal incorrect';
  perform public.community_write('save',jsonb_build_object('post_id',p,'saved',true));
  assert exists(select 1 from public.community_saves where post_id=p),'save missing';
  rejected:=false;begin perform public.community_write('edit_post',jsonb_build_object('post_id',p,'title','Hijacked','body','Bad','flair','General'));exception when others then rejected:=true;end;
  assert rejected,'other author edit accepted';
  perform public.community_write('report',jsonb_build_object('post_id',p,'reason','Test report'));
  assert exists(select 1 from public.community_reports where post_id=p),'moderator cannot see report';
  perform public.community_write('lock',jsonb_build_object('post_id',p));
  rejected:=false;begin perform public.community_write('comment',jsonb_build_object('post_id',p,'body','Locked reply'));exception when others then rejected:=true;end;
  assert rejected,'locked reply accepted';
  perform public.community_write('hide',jsonb_build_object('post_id',p,'comment_id',c));
  assert (select body='[Removed by a moderator]' from public.community_comments where id=c),'hidden comment exposes body';
  perform public.community_write('hide',jsonb_build_object('post_id',p));
end;
$$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$begin
  assert not exists(select 1 from public.community_posts where id=current_setting('test.post_id')::uuid),'hidden post publicly readable';
  assert not exists(select 1 from public.community_feed where id=current_setting('test.post_id')::uuid),'feed bypasses RLS';
  assert not exists(select 1 from public.community_comments where post_id=current_setting('test.post_id')::uuid),'hidden post comments readable';
  assert not has_table_privilege('anon','public.community_reports','select'),'reports exposed';
  assert not has_table_privilege('authenticated','public.community_admin_emails','insert'),'roles writable';
end;$$;
rollback;
select 'Community integration checks passed; fixtures rolled back' as result;
