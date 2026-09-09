begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id text primary key default ('user_' || gen_random_uuid()),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(btrim(username)) and char_length(username) between 3 and 40 and username ~ '^[[:alnum:]가-힣._-]+$'),
  display_name text not null check (char_length(display_name) between 1 and 30),
  email text not null,
  code text not null unique check (code ~ '^#[0-9]{4}$'),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.rooms (
  id text primary key default ('room_' || gen_random_uuid()),
  owner_id text not null references public.profiles(id),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  plan_text text not null default '' check (char_length(plan_text) <= 5000),
  legacy_members jsonb not null default '[]' check(jsonb_typeof(legacy_members)='array'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.room_members (
  room_id text not null references public.rooms(id) on delete cascade,
  user_id text not null references public.profiles(id),
  name text not null, code text not null, emoji text not null default '✈️', owner boolean not null default false,
  created_at timestamptz not null default now(), primary key(room_id,user_id)
);
create table public.photos (
  id text primary key default ('photo_' || gen_random_uuid()),
  user_id text not null references public.profiles(id),
  room_id text references public.rooms(id),
  label text not null check (char_length(label) between 1 and 100), date date not null default current_date,
  source text not null default 'upload' check(char_length(source)<=160),
  storage_path text not null unique, filename text, mime_type text,
  created_at timestamptz not null default now()
);
create table public.mission_completions (
  id text primary key default ('mission_' || gen_random_uuid()),
  user_id text not null references public.profiles(id), room_id text references public.rooms(id),
  mission_id integer not null check(mission_id between 1 and 6),
  photo_id text references public.photos(id), completed_at timestamptz not null default now(),
  unique nulls not distinct(user_id,room_id,mission_id)
);
create table public.reward_transactions (
  id text primary key default ('reward_' || gen_random_uuid()),
  user_id text not null references public.profiles(id),
  category text not null check(category in ('points','localMoney')), amount integer not null,
  title text not null, description text not null default '',
  mission_id integer check(mission_id between 1 and 6), room_id text references public.rooms(id),
  created_at timestamptz not null default now()
);
create table public.diaries (
  id text primary key default ('diary_' || gen_random_uuid()), user_id text not null references public.profiles(id),
  date date not null default current_date, title text not null default '오늘의 여행' check(char_length(title) between 1 and 100),
  text text not null default '' check(char_length(text)<=10000), photo_ids text[] not null default '{}', image_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(cardinality(photo_ids)<=20)
);
create table public.four_cuts (
  id text primary key default ('fourcut_' || gen_random_uuid()), user_id text not null references public.profiles(id),
  photo_ids text[] not null, filter text not null default '감성' check(char_length(filter)<=30), image_path text,
  created_at timestamptz not null default now()
);
create table public.shares (
  id text primary key default ('share_' || gen_random_uuid()), user_id text not null references public.profiles(id),
  kind text not null default 'moment' check(char_length(kind)<=30), target_id text check(char_length(target_id)<=160),
  channel text not null default 'system' check(char_length(channel)<=30), created_at timestamptz not null default now()
);
create table public.inquiries (
  id text primary key default ('inquiry_' || gen_random_uuid()), user_id text not null references public.profiles(id),
  category text not null default '이용 문의' check(char_length(category)<=40),
  message text not null check(char_length(btrim(message)) between 1 and 2000), created_at timestamptz not null default now()
);
create index on public.room_members(user_id);
create index on public.photos(user_id,created_at desc);
create index on public.diaries(user_id,updated_at desc);
create index on public.reward_transactions(user_id,created_at desc);
create index on public.four_cuts(user_id);
create index on public.shares(user_id);
create index on public.inquiries(user_id);

create function private.user_id() returns text language sql stable security definer set search_path='' as $$
  select id from public.profiles where auth_id=(select auth.uid())
$$;
create function private.in_room(p_room text) returns boolean language sql stable security definer set search_path='' as $$
  select p_room is null or exists(select 1 from public.room_members where room_id=p_room and user_id=private.user_id())
$$;
create function private.owns_path(p_path text) returns boolean language sql stable security definer set search_path='' as $$
  select p_path is null or (split_part(p_path,'/',1)=private.user_id() and exists(
    select 1 from storage.objects where bucket_id='momentrip-photos' and name=p_path))
$$;
create function private.validate_owned_record() returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP='UPDATE' then
    if new.id<>old.id or new.user_id<>old.user_id then raise exception '소유자는 변경할 수 없습니다.'; end if;
  end if;
  if TG_TABLE_NAME='photos' then
    if not private.in_room(new.room_id) or not private.owns_path(new.storage_path) then raise exception '사진 접근 권한이 없습니다.'; end if;
  else
    if exists(select 1 from unnest(new.photo_ids) p where not exists(select 1 from public.photos where id=p and user_id=new.user_id)) then
      raise exception '본인의 사진만 사용할 수 있습니다.';
    end if;
    if not private.owns_path(new.image_path) then raise exception '이미지 접근 권한이 없습니다.'; end if;
    if TG_TABLE_NAME='four_cuts' and (select count(distinct p) from unnest(new.photo_ids) p)<>4 then
      raise exception '네컷사진에는 서로 다른 사진 4장이 필요합니다.';
    end if;
    if TG_TABLE_NAME='diaries' then new.updated_at=now(); end if;
  end if;
  return new;
end $$;
-- Admin imports run without a user JWT and validate references in the importer.
create trigger validate_photo before insert or update on public.photos for each row when (auth.uid() is not null) execute function private.validate_owned_record();
create trigger validate_diary before insert or update on public.diaries for each row when (auth.uid() is not null) execute function private.validate_owned_record();
create trigger validate_fourcut before insert or update on public.four_cuts for each row when (auth.uid() is not null) execute function private.validate_owned_record();

-- Array relationships retained for the existing UI still need delete integrity.
create function private.protect_photo_references() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.diaries where old.id=any(photo_ids)) or
     exists(select 1 from public.four_cuts where old.id=any(photo_ids)) then
    raise exception '다이어리 또는 네컷에서 사용 중인 사진은 삭제할 수 없습니다.';
  end if;
  return old;
end $$;
create trigger protect_photo_delete before delete on public.photos for each row execute function private.protect_photo_references();

create function private.bootstrap_user() returns trigger language plpgsql security definer set search_path='' as $$
declare u text; n text; c text; pid text;
begin
  -- Only the admin Auth API can set app_metadata; user_metadata cannot bypass this trigger.
  if new.raw_app_meta_data->>'legacy_import'='true' then return new; end if;
  u=lower(btrim(new.raw_user_meta_data->>'username'));
  n=coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),'여행자님');
  if u is null or new.email <> 'user-'||left(encode(sha256(convert_to(u,'UTF8')),'hex'),56)||'@auth.momentrip.invalid' then
    raise exception '올바른 아이디로 가입해주세요.';
  end if;
  -- Serialize allocation of the existing four-digit public user code.
  perform pg_advisory_xact_lock(9042001);
  select '#'||lpad(i::text,4,'0') into c from generate_series(1000,9999) i
    where not exists(select 1 from public.profiles where code='#'||lpad(i::text,4,'0')) order by random() limit 1;
  if c is null then raise exception '사용자 코드가 소진되었습니다.'; end if;
  insert into public.profiles(auth_id,username,display_name,email,code) values(new.id,u,n,new.email,c) returning id into pid;
  insert into public.reward_transactions(user_id,category,amount,title,description) values
    (pid,'localMoney',5000,'가입 축하 지역화폐','첫 여행을 시작할 수 있도록 지급된 가입 보상입니다.'),
    (pid,'points',1000,'가입 리워드 포인트','첫 여행 기록을 시작해보세요.');
  return new;
end $$;
create trigger momentrip_new_user after insert on auth.users for each row execute function private.bootstrap_user();

create function public.check_username(p_username text) returns boolean language sql stable security definer set search_path='' as $$
  select char_length(btrim(p_username)) between 3 and 40 and not exists(select 1 from public.profiles where username=lower(btrim(p_username)))
$$;
create function public.find_friends(p_query text default '') returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (
    select id,display_name as name,code,'✈️' as emoji from public.profiles
    where private.user_id() is not null and id<>private.user_id()
      and (p_query='' or strpos(lower(username||' '||display_name||' '||code),lower(left(p_query,100)))>0)
    order by created_at limit 20
  ) t
$$;
create function public.create_room(p_name text default '',p_member_ids text[] default '{}',p_plan_text text default '') returns text language plpgsql security definer set search_path='' as $$
declare u public.profiles; rid text;
begin
  select * into u from public.profiles where id=private.user_id();
  if u.id is null then raise exception '로그인이 필요합니다.'; end if;
  insert into public.rooms(owner_id,name,plan_text) values(u.id,coalesce(nullif(btrim(p_name),''),u.display_name||'님의 여행방'),btrim(p_plan_text)) returning id into rid;
  insert into public.room_members(room_id,user_id,name,code,owner) values(rid,u.id,u.display_name,u.code,true);
  insert into public.room_members(room_id,user_id,name,code)
    select rid,id,display_name,code from public.profiles where id=any(p_member_ids[1:4]) and id<>u.id;
  return rid;
end $$;
create function public.join_room(p_invite_code text) returns text language plpgsql security definer set search_path='' as $$
declare rid text; u public.profiles;
begin
  select * into u from public.profiles where id=private.user_id();
  if u.id is null then raise exception '로그인이 필요합니다.'; end if;
  select id into rid from public.rooms where invite_code=upper(btrim(p_invite_code)) for update;
  if rid is null then raise exception '일치하는 초대코드의 방을 찾을 수 없습니다.'; end if;
  insert into public.room_members(room_id,user_id,name,code) values(rid,u.id,u.display_name,u.code) on conflict do nothing;
  return rid;
end $$;
create function public.complete_mission(p_mission_id integer,p_photo_id text,p_room_id text default null,p_earned_points integer default null,p_title text default null)
returns void language plpgsql security definer set search_path='' as $$
declare uid text=private.user_id(); pts integer; title text;
begin
  if uid is null then raise exception '로그인이 필요합니다.'; end if;
  if p_mission_id is null or p_mission_id not between 1 and 6 then raise exception '미션을 찾을 수 없습니다.'; end if;
  -- All balance-changing operations lock the same user row, including conversion.
  perform 1 from public.profiles where id=uid for update;
  if not private.in_room(p_room_id) then raise exception '여행방을 찾을 수 없습니다.'; end if;
  if not exists(select 1 from public.photos where id=p_photo_id and user_id=uid and room_id is not distinct from p_room_id) then
    raise exception '미션을 완료하려면 현재 여행방의 사진이 필요합니다.';
  end if;
  if exists(select 1 from public.mission_completions where user_id=uid and room_id is not distinct from p_room_id and mission_id=p_mission_id) then return; end if;
  pts=least((array[340,520,260,820,180,1000])[p_mission_id], greatest(0,coalesce(p_earned_points,(array[300,500,200,800,100,1000])[p_mission_id])));
  title=coalesce(nullif(left(btrim(p_title),80),''),(array['현지 음식 먹기','야경 사진 찍기','길거리 음식 시도','낯선 사람과 대화','현지 카페 방문','랜드마크 셀카'])[p_mission_id]);
  insert into public.mission_completions(user_id,room_id,mission_id,photo_id) values(uid,p_room_id,p_mission_id,p_photo_id);
  insert into public.reward_transactions(user_id,room_id,mission_id,category,amount,title,description) values
    (uid,p_room_id,p_mission_id,'localMoney',1000,title||' 지역화폐 적립','여행 미션 인증 보상'),
    (uid,p_room_id,p_mission_id,'points',pts,title||' 리워드','미션 완료 포인트');
end $$;
create function public.convert_currency(p_amount integer,p_region_name text default '충청남도',p_currency text default '지역화폐') returns void
language plpgsql security definer set search_path='' as $$
declare uid text=private.user_id(); balance bigint;
begin
  if uid is null then raise exception '로그인이 필요합니다.'; end if;
  if p_amount is null or p_amount<=0 or p_amount>1000000 then raise exception '전환 금액이 올바르지 않습니다.'; end if;
  perform 1 from public.profiles where id=uid for update;
  select coalesce(sum(amount),0) into balance from public.reward_transactions where user_id=uid and category='points';
  if balance<p_amount then raise exception '보유 포인트가 부족합니다.'; end if;
  insert into public.reward_transactions(user_id,category,amount,title,description)
    values(uid,'points',-p_amount,left(p_region_name,40)||' '||left(p_currency,40)||' 전환','앱 테스트용 지역화폐 전환 내역');
end $$;

-- Deny by default. No anonymous table access, and no client writes to membership/rewards/completions.
do $$ declare t text; begin
  foreach t in array array['profiles','rooms','room_members','photos','mission_completions','reward_transactions','diaries','four_cuts','shares','inquiries'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
  foreach t in array array['photos','diaries','four_cuts','shares','inquiries','mission_completions','reward_transactions'] loop
    execute format('create policy own_select on public.%I for select to authenticated using (user_id=(select private.user_id()))',t);
  end loop;
  foreach t in array array['photos','diaries','four_cuts','shares','inquiries'] loop
    execute format('grant insert, update, delete on public.%I to authenticated',t);
    execute format('create policy own_insert on public.%I for insert to authenticated with check (user_id=(select private.user_id()))',t);
    execute format('create policy own_update on public.%I for update to authenticated using (user_id=(select private.user_id())) with check (user_id=(select private.user_id()))',t);
    execute format('create policy own_delete on public.%I for delete to authenticated using (user_id=(select private.user_id()))',t);
  end loop;
end $$;
create policy profile_read on public.profiles for select to authenticated using(auth_id=(select auth.uid()));
grant update(display_name,code,avatar_path,updated_at) on public.profiles to authenticated;
create policy profile_update on public.profiles for update to authenticated using(auth_id=(select auth.uid())) with check(auth_id=(select auth.uid()) and private.owns_path(avatar_path));
create policy room_read on public.rooms for select to authenticated using(private.in_room(id));
create policy members_read on public.room_members for select to authenticated using(private.in_room(room_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('momentrip-photos','momentrip-photos',false,16777216,array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy momentrip_photo_read on storage.objects for select to authenticated
using(bucket_id='momentrip-photos' and (storage.foldername(name))[1]=(select private.user_id()));
create policy momentrip_photo_insert on storage.objects for insert to authenticated
with check(bucket_id='momentrip-photos' and (storage.foldername(name))[1]=(select private.user_id()));
-- Objects are immutable. Replacements get a new UUID path.
create policy momentrip_photo_delete on storage.objects for delete to authenticated
using(bucket_id='momentrip-photos' and (storage.foldername(name))[1]=(select private.user_id())
  and not exists(select 1 from public.photos where storage_path=name)
  and not exists(select 1 from public.diaries where image_path=name)
  and not exists(select 1 from public.four_cuts where image_path=name)
  and not exists(select 1 from public.profiles where avatar_path=name));

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.user_id(),private.in_room(text),private.owns_path(text),private.validate_owned_record() to authenticated;
revoke all on function public.check_username(text),public.find_friends(text),public.create_room(text,text[],text),public.join_room(text),public.complete_mission(integer,text,text,integer,text),public.convert_currency(integer,text,text) from public,anon,authenticated;
grant execute on function public.check_username(text) to anon,authenticated;
grant execute on function public.find_friends(text),public.create_room(text,text[],text),public.join_room(text),public.complete_mission(integer,text,text,integer,text),public.convert_currency(integer,text,text) to authenticated;
commit;
