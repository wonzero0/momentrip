import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
// Partial configuration must fail explicitly instead of silently writing to the old backend.
export const supabaseRequested = Boolean(url || key);
let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!url || !key) throw new Error('VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 설정해주세요.');
  if (!key.startsWith('sb_publishable_')) throw new Error('Supabase Publishable Key만 사용할 수 있습니다.');
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'momentrip.supabase.auth' },
    });
  }
  return client;
}

export async function supabaseAuthEmail(username: string): Promise<string> {
  const bytes = new TextEncoder().encode(username.trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `user-${hex.slice(0, 56)}@auth.momentrip.invalid`;
}
