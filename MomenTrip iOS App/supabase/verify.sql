-- Read-only audit. Run in the project's SQL Editor after applying the migration.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in ('profiles','rooms','room_members','photos','mission_completions','reward_transactions','diaries','four_cuts','shares','inquiries')
order by c.relname;

select n.nspname as schema_name,p.proname as function_name,p.prosecdef as security_definer,p.proconfig as settings
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='private' and p.proname in ('user_id','in_room','owns_path','validate_owned_record','protect_photo_references','bootstrap_user'))
   or (n.nspname='public' and p.proname in ('check_username','find_friends','create_room','join_room','complete_mission','convert_currency'))
order by 1,2;

select trigger_schema,event_object_table,trigger_name,action_timing,event_manipulation
from information_schema.triggers
where trigger_name in ('momentrip_new_user','validate_photo','validate_diary','validate_fourcut','protect_photo_delete')
order by trigger_name;

select id,public,file_size_limit,allowed_mime_types from storage.buckets where id='momentrip-photos';
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies
where (schemaname='public' and tablename in ('profiles','rooms','room_members','photos','mission_completions','reward_transactions','diaries','four_cuts','shares','inquiries'))
   or (schemaname='storage' and policyname like 'momentrip_photo_%')
order by schemaname,tablename,policyname;
