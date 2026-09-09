import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { authEmail, validateLegacy, decodeImage } from '../../scripts/migrate-supabase.mjs';
import { assertPublicEnvSafe } from '../../scripts/check-public-env.mjs';
const db = new PGlite();
const a='10000000-0000-0000-0000-000000000001', b='20000000-0000-0000-0000-000000000002', c='30000000-0000-0000-0000-000000000003';
async function scalar(sql,params=[]) { const result=await db.query(sql,params); return Object.values(result.rows[0])[0]; }
async function asUser(uid,work) {
  await db.exec('begin; set local role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);
  try { const result=await work(); await db.exec('commit'); return result; } catch(error) { await db.exec('rollback'); throw error; }
}
try {
  // Minimal Supabase platform schemas; actual application SQL runs unchanged.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,storage,public to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,primary key(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
  `);
  await db.exec(await readFile(new URL('../migrations/202609090001_momentrip.sql',import.meta.url),'utf8'));
  for(const [id,username] of [[a,'tester_a'],[b,'tester_b'],[c,'tester_c']]) await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,authEmail(username),JSON.stringify({username})]);
  const aid=await scalar('select id from public.profiles where auth_id=$1',[a]);
  const bid=await scalar('select id from public.profiles where auth_id=$1',[b]);
  assert.equal(await asUser(a,()=>scalar('select count(*) from public.profiles')),1);
  assert.equal(await asUser(a,()=>scalar('select sum(amount) from public.reward_transactions where category=\'points\'')),1000);
  await assert.rejects(asUser(a,()=>db.query('insert into public.reward_transactions(user_id,category,amount,title) values($1,\'points\',999999,\'hack\')',[aid])));
  await assert.rejects(asUser(a,()=>db.query('update public.profiles set auth_id=$1 where id=$2',[b,aid])));
  const rid=await asUser(a,()=>scalar("select public.create_room('test room','{}','plan')"));
  assert.equal(await asUser(b,()=>scalar('select count(*) from public.rooms')),0);
  await assert.rejects(asUser(b,()=>db.query('insert into public.room_members(room_id,user_id,name,code) values($1,$2,\'fake\',\'#0000\')',[rid,bid])));
  const code=await asUser(a,()=>scalar('select invite_code from public.rooms where id=$1',[rid]));
  await asUser(b,()=>scalar('select public.join_room($1)',[code]));
  assert.equal(await asUser(b,()=>scalar('select count(*) from public.rooms')),1);
  assert.equal(await asUser(c,()=>scalar('select count(*) from public.room_members')),0);
  const pic=await asUser(a,async()=>{
    await db.query("insert into storage.objects(bucket_id,name) values('momentrip-photos',$1)",[`${aid}/photo`]);
    return scalar('insert into public.photos(user_id,room_id,label,storage_path) values($1,$2,\'photo\',$3) returning id',[aid,rid,`${aid}/photo`]);
  });
  assert.equal(await asUser(b,()=>scalar('select count(*) from public.photos')),0);
  assert.equal(await asUser(b,()=>scalar('select count(*) from storage.objects')),0);
  await assert.rejects(asUser(b,()=>db.query("insert into storage.objects(bucket_id,name) values('momentrip-photos',$1)",[`${aid}/stolen`])));
  await assert.rejects(asUser(b,()=>db.query('insert into public.photos(user_id,label,storage_path) values($1,\'stolen\',$2)',[bid,`${aid}/photo`])));
  await assert.rejects(asUser(b,()=>db.query('select public.complete_mission(1,$1,$2,300,null)',[pic,rid])));
  await asUser(a,()=>db.query('select public.complete_mission(1,$1,$2,999999,null)',[pic,rid]));
  await asUser(a,()=>db.query('select public.complete_mission(1,$1,$2,999999,null)',[pic,rid]));
  assert.equal(await asUser(a,()=>scalar('select count(*) from public.mission_completions')),1);
  assert.equal(await asUser(a,()=>scalar("select sum(amount) from public.reward_transactions where category='points'")),1340);
  await assert.rejects(asUser(a,()=>db.query('select public.convert_currency(2000)')));
  await asUser(a,()=>db.query('select public.convert_currency(1000)'));
  await assert.rejects(asUser(a,()=>db.query('select public.convert_currency(1000)')));
  assert.equal(await asUser(a,()=>scalar("select sum(amount) from public.reward_transactions where category='points'")),340);
  const before=await scalar('select count(*) from public.reward_transactions');
  await assert.rejects(asUser(a,async()=>{await db.query('select public.convert_currency(100)');await db.query('select public.convert_currency(1000)');}));
  assert.equal(await scalar('select count(*) from public.reward_transactions'),before);
  await assert.rejects(asUser(b,()=>db.query("insert into public.diaries(user_id,photo_ids) values($1,$2)",[bid,[pic]])));
  await assert.rejects(asUser(a,()=>db.query("insert into public.four_cuts(user_id,photo_ids) values($1,$2)",[aid,[pic,pic,pic,pic]])));
  await asUser(a,()=>db.query("insert into public.diaries(user_id,photo_ids) values($1,$2)",[aid,[pic]]));
  await asUser(a,()=>db.query("insert into public.inquiries(user_id,message) values($1,'test')",[aid]));
  assert.equal(await asUser(b,()=>scalar('select count(*) from public.diaries')),0);
  assert.equal(await asUser(b,()=>scalar('select count(*) from public.inquiries')),0);
  // A referenced object cannot be deleted through the Storage policy.
  await asUser(a,()=>db.query('delete from storage.objects where name=$1',[`${aid}/photo`]));
  assert.equal(await scalar('select count(*) from storage.objects'),1);
  await db.exec('begin; set local role anon');
  assert.equal(await scalar("select public.check_username('unused_name')"),true);
  await db.exec('rollback');
  await assert.rejects((async()=>{await db.exec('begin; set local role anon'); try {await db.exec('select * from public.profiles');} finally {await db.exec('rollback');}})());
  assert.equal(await scalar("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity"),0);
  assert.throws(()=>validateLegacy({photos:[{id:'p',userId:'missing'}]}));
  assert.throws(()=>decodeImage('https://example.com/image.jpg'));
  assert(authEmail('한글테스트'.repeat(5)).split('@')[0].length<=64);
  assert.throws(()=>assertPublicEnvSafe({VITE_DB_PASSWORD:'fixture'}));
  assert.throws(()=>assertPublicEnvSafe({VITE_SUPABASE_PUBLISHABLE_KEY:['sb','secret','fixture'].join('_')}));
  assert.throws(()=>assertPublicEnvSafe({VITE_UNEXPECTED:['postgres', '://fixture'].join('')}));
  assert.doesNotThrow(()=>assertPublicEnvSafe({VITE_SUPABASE_PUBLISHABLE_KEY:['sb','publishable','fixture'].join('_')}));
  console.log('PASS: migration SQL, Auth trigger, RLS isolation, room membership, private storage, reward caps/idempotency/rollback, insufficient balance, ownership, importer validation');
} finally { await db.close(); }
