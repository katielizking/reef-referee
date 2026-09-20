-- Additive community schema. Existing aquarium tables and policies are untouched.
begin;
create table public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-zA-Z][a-zA-Z0-9_]{2,23}$'),
  created_at timestamptz not null default now()
);
create table public.community_admin_emails (email text primary key);
create table public.community_bans (user_id uuid primary key references auth.users(id), created_at timestamptz default now());
create table public.community_posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.community_profiles(id),
  title text not null check (char_length(title) between 3 and 180), body text not null default '' check (char_length(body)<=15000),
  link_url text check (link_url is null or (link_url ~ '^https://[^[:space:]]+$' and char_length(link_url)<=2000)),
  flair text not null default 'General' check (flair in ('General','Question','Show & tell','Progress','Discussion','Equipment','Plants','Inspiration')),
  status text not null default 'visible' check (status in ('visible','hidden','deleted')),
  locked boolean not null default false, score integer not null default 0, comment_count integer not null default 0,
  created_at timestamptz not null default now(), edited_at timestamptz
);
create table public.community_comments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.community_profiles(id), parent_id uuid references public.community_comments(id),
  body text not null check (char_length(body) between 1 and 8000), status text not null default 'visible' check (status in ('visible','hidden','deleted')),
  created_at timestamptz not null default now(), edited_at timestamptz
);
create table public.community_votes (post_id uuid references public.community_posts(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,value smallint not null check(value in (-1,1)),primary key(post_id,user_id));
create table public.community_saves (post_id uuid references public.community_posts(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,primary key(post_id,user_id));
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),post_id uuid not null references public.community_posts(id),comment_id uuid references public.community_comments(id),
  reporter_id uuid not null references auth.users(id),reason text not null check(char_length(reason) between 3 and 1000),
  resolved boolean not null default false,created_at timestamptz not null default now()
);
create table public.community_actions (user_id uuid not null,created_at timestamptz not null default now());
create index community_actions_rate on public.community_actions(user_id,created_at);
create index community_posts_new on public.community_posts(created_at desc) where status='visible';
create index community_comments_thread on public.community_comments(post_id,created_at);
create index community_reports_queue on public.community_reports(created_at) where not resolved;

create function public.community_is_moderator() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from auth.users u join public.community_admin_emails a on lower(a.email)=lower(u.email) where u.id=auth.uid() and u.email_confirmed_at is not null and not u.is_anonymous);
$$;

alter table public.community_profiles enable row level security;
alter table public.community_admin_emails enable row level security;
alter table public.community_bans enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_votes enable row level security;
alter table public.community_saves enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_actions enable row level security;
create policy profiles_read on public.community_profiles for select using(true);
create policy posts_read on public.community_posts for select using(status='visible' or author_id=auth.uid() or public.community_is_moderator());
create policy comments_read on public.community_comments for select using(exists(select 1 from public.community_posts p where p.id=post_id and (p.status='visible' or p.author_id=auth.uid() or public.community_is_moderator())));
create policy votes_read on public.community_votes for select using(user_id=auth.uid());
create policy saves_read on public.community_saves for select using(user_id=auth.uid());
create policy reports_read on public.community_reports for select using(public.community_is_moderator());
revoke all on public.community_profiles,public.community_admin_emails,public.community_bans,public.community_posts,public.community_comments,public.community_votes,public.community_saves,public.community_reports,public.community_actions from anon,authenticated;
grant select on public.community_profiles,public.community_posts,public.community_comments to anon,authenticated;
grant select on public.community_votes,public.community_saves,public.community_reports to authenticated;
create view public.community_feed with (security_invoker=true) as
  select p.*, p.score / power(greatest(extract(epoch from (now()-p.created_at))/3600,0)+2,1.5) as hot_rank from public.community_posts p;
grant select on public.community_feed to anon,authenticated;

-- All writes go through one checked endpoint. Clients cannot set counters, owners,
-- timestamps, moderation state or roles. Lock each member to serialize rate limits.
create function public.community_write(action text,payload jsonb default '{}'::jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); target uuid; pid uuid; parent uuid; previous smallint; vote smallint; ismod boolean; p public.community_posts; c public.community_comments;
begin
  if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not is_anonymous) then raise exception 'Sign in with a confirmed email to participate.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if exists(select 1 from public.community_bans where user_id=uid) then raise exception 'This account cannot participate.'; end if;
  if (select count(*) from public.community_actions where user_id=uid and created_at>now()-interval '1 minute')>=20
    or (select count(*) from public.community_actions where user_id=uid and created_at>now()-interval '1 day')>=300 then raise exception 'Please slow down and try again later.'; end if;
  insert into public.community_actions(user_id) values(uid);
  ismod:=public.community_is_moderator();
  if action='profile' then
    insert into public.community_profiles(id,handle) values(uid,trim(payload->>'handle')) on conflict(id) do update set handle=excluded.handle;
    return uid;
  end if;
  if not exists(select 1 from public.community_profiles where id=uid) then raise exception 'Choose a community username first.'; end if;
  if action='post' then
    if (select count(*) from public.community_posts where author_id=uid and created_at>now()-interval '1 hour')>=5 then raise exception 'You can create up to five posts per hour.'; end if;
    if char_length(trim(coalesce(payload->>'body','')))=0 and nullif(payload->>'link_url','') is null then raise exception 'Add some text or a link.'; end if;
    insert into public.community_posts(author_id,title,body,link_url,flair) values(uid,trim(payload->>'title'),trim(coalesce(payload->>'body','')),nullif(payload->>'link_url',''),coalesce(payload->>'flair','General')) returning id into target;
    return target;
  end if;
  pid:=(payload->>'post_id')::uuid;
  select * into p from public.community_posts where id=pid for update;
  if not found then raise exception 'Post not found.'; end if;
  if action in ('hide','restore','lock','unlock','resolve','ban') then
    if not ismod then raise exception 'Moderator access required.'; end if;
    if action='hide' then
      if nullif(payload->>'comment_id','') is not null then update public.community_comments set status='hidden',body='[Removed by a moderator]' where id=(payload->>'comment_id')::uuid and post_id=pid;
      else update public.community_posts set status='hidden' where id=pid; end if;
    elsif action='restore' then update public.community_posts set status='visible' where id=pid and status='hidden';
    elsif action in ('lock','unlock') then update public.community_posts set locked=(action='lock') where id=pid;
    elsif action='ban' then
      insert into public.community_bans(user_id) select author_id from public.community_comments where id=nullif(payload->>'comment_id','')::uuid and post_id=pid on conflict do nothing;
      if nullif(payload->>'comment_id','') is null then insert into public.community_bans(user_id) values(p.author_id) on conflict do nothing; end if;
    else update public.community_reports set resolved=true where id=(payload->>'report_id')::uuid and post_id=pid; end if;
    return pid;
  end if;
  if action='delete_post' and p.author_id=uid then update public.community_posts set status='deleted',title='[Deleted]',body='',link_url=null where id=pid; return pid; end if;
  if p.status<>'visible' then raise exception 'This post is unavailable.'; end if;
  if action='vote' then
    if p.author_id=uid then raise exception 'You cannot vote on your own post.'; end if;
    vote:=(payload->>'value')::smallint;
    if vote not in (-1,0,1) or vote is null then raise exception 'Invalid vote.'; end if;
    select value into previous from public.community_votes where post_id=pid and user_id=uid;
    delete from public.community_votes where post_id=pid and user_id=uid;
    if vote<>0 then insert into public.community_votes values(pid,uid,vote); end if;
    update public.community_posts set score=score-coalesce(previous,0)+vote where id=pid;
  elsif action='save' then
    if coalesce((payload->>'saved')::boolean,false) then insert into public.community_saves values(pid,uid) on conflict do nothing;
    else delete from public.community_saves where post_id=pid and user_id=uid; end if;
  elsif action='report' then
    parent:=nullif(payload->>'comment_id','')::uuid;
    if parent is not null and not exists(select 1 from public.community_comments where id=parent and post_id=pid) then raise exception 'Comment not found.'; end if;
    if exists(select 1 from public.community_reports where post_id=pid and comment_id is not distinct from parent and reporter_id=uid) then raise exception 'You have already reported this content.'; end if;
    insert into public.community_reports(post_id,comment_id,reporter_id,reason) values(pid,parent,uid,trim(payload->>'reason'));
  elsif action='edit_post' then
    if p.author_id<>uid or p.locked then raise exception 'You cannot edit this post.'; end if;
    if char_length(trim(coalesce(payload->>'body','')))=0 and nullif(payload->>'link_url','') is null then raise exception 'Add some text or a link.'; end if;
    update public.community_posts set title=trim(payload->>'title'),body=trim(coalesce(payload->>'body','')),link_url=nullif(payload->>'link_url',''),flair=payload->>'flair',edited_at=now() where id=pid;
  elsif action='comment' then
    if p.locked then raise exception 'This discussion is locked.'; end if;
    if (select count(*) from public.community_comments where author_id=uid and created_at>now()-interval '1 hour')>=30 then raise exception 'Comment limit reached. Try again later.'; end if;
    parent:=nullif(payload->>'parent_id','')::uuid;
    if parent is not null then
      select * into c from public.community_comments where id=parent and post_id=pid;
      if not found or c.status<>'visible' then raise exception 'Reply target unavailable.'; end if;
      if c.parent_id is not null then raise exception 'Reply to the top-level comment to continue this thread.'; end if;
    end if;
    insert into public.community_comments(post_id,author_id,parent_id,body) values(pid,uid,parent,trim(payload->>'body')) returning id into target;
    update public.community_posts set comment_count=comment_count+1 where id=pid;
    return target;
  elsif action in ('delete_comment','edit_comment') then
    target:=(payload->>'comment_id')::uuid;
    select * into c from public.community_comments where id=target and post_id=pid;
    if not found or c.author_id<>uid or c.status<>'visible' then raise exception 'You cannot change this comment.'; end if;
    if action='edit_comment' then
      if p.locked then raise exception 'This discussion is locked.'; end if;
      update public.community_comments set body=trim(payload->>'body'),edited_at=now() where id=target;
    else update public.community_comments set body='[Deleted by author]',status='deleted' where id=target; end if;
  else raise exception 'Unknown action.';
  end if;
  return pid;
end;
$$;
revoke all on function public.community_write(text,jsonb) from public,anon;
grant execute on function public.community_write(text,jsonb) to authenticated;
revoke all on function public.community_is_moderator() from public;
grant execute on function public.community_is_moderator() to anon,authenticated;
commit;
