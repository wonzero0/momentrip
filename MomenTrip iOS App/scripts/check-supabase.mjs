// Read-only remote checks. Never logs keys, response bodies, user data, or tokens.
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { assertPublicEnvSafe } from './check-public-env.mjs';

const env = loadEnv('development', process.cwd(), 'VITE_');
assertPublicEnvSafe(env);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Missing Supabase browser environment variables.');
createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
console.log('Client initialization: PASS');
async function probe(route, name) {
  try {
    const response = await fetch(new URL(route, url), { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => null);
    return { name, status: response.status, code: data?.code, data };
  } catch { return { name, status: 0, code: 'NETWORK_ERROR' }; }
}
const tables = ['profiles','rooms','room_members','photos','mission_completions','reward_transactions','diaries','four_cuts','shares','inquiries'];
const results = await Promise.all([
  probe('/auth/v1/settings', 'auth'),
  probe('/storage/v1/bucket', 'storage'),
  probe('/rest/v1/rpc/check_username?p_username=connection_probe', 'username_rpc'),
  ...tables.map(table => probe(`/rest/v1/${table}?select=*&limit=0`, table)),
]);
const auth = results.find(result => result.name === 'auth');
const storage = results.find(result => result.name === 'storage');
console.log(JSON.stringify({ auth: { status: auth.status, emailEnabled: auth.data?.external?.email, signupDisabled: auth.data?.disable_signup, emailAutoconfirm: auth.data?.mailer_autoconfirm } }));
console.log(JSON.stringify({ storage: { status: storage.status, visibleBucketCount: Array.isArray(storage.data) ? storage.data.length : null, note: 'Anonymous bucket listings cannot verify private bucket existence or policies.' } }));
const missing = [];
let checksNeedReview = false;
for (const result of results.filter(result => !['auth','storage'].includes(result.name))) {
  const state = ['PGRST205','PGRST202'].includes(result.code) ? 'SCHEMA_MISSING'
    : result.code === '42501' ? 'EXISTS_ACCESS_DENIED'
    : result.status === 200 ? 'REACHABLE' : 'CHECK_REQUIRED';
  console.log(JSON.stringify({ check: result.name, status: result.status, code: result.code, state }));
  if (state === 'SCHEMA_MISSING') missing.push(result.name);
  if (state === 'CHECK_REQUIRED' || (result.name === 'username_rpc' && state !== 'REACHABLE')) checksNeedReview = true;
}
const connected = auth.status === 200 && storage.status === 200;
console.log(`API connection: ${connected ? 'PASS' : 'FAIL'}`);
console.log(`Schema readiness: ${missing.length ? 'NOT APPLIED (' + missing.length + ' missing objects)' : 'requires privileged RLS/trigger audit'}`);
console.log(`ID/password signup settings: ${auth.data?.external?.email && !auth.data?.disable_signup && auth.data?.mailer_autoconfirm ? 'PASS' : 'ACTION REQUIRED'}`);
// A live connection is distinct from an application-ready schema.
if (!connected) process.exitCode = 1;
else if (missing.length || checksNeedReview || !auth.data?.external?.email || auth.data?.disable_signup || !auth.data?.mailer_autoconfirm) process.exitCode = 2;
