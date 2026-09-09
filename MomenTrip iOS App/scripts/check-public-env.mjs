// Build-time only: values never appear in errors or logs.
export function assertPublicEnvSafe(env) {
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('VITE_') || !value) continue;
    let privilegedJwt = false;
    try { privilegedJwt = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch {}
    if (/PASSWORD|SECRET|SERVICE_ROLE|PRIVATE_KEY|DATABASE_URL|CONNECTION_STRING|ACCESS_TOKEN|AUTH_TOKEN/i.test(name)
      || /sb_secret_|postgres(?:ql)?:\/\/|-----BEGIN .*PRIVATE KEY-----|\bsk-[A-Za-z0-9]|\bgh[pousr]_/i.test(value) || privilegedJwt) {
      throw new Error(`Server-only credential detected in ${name}. Remove it from VITE_* variables before building.`);
    }
    if (name === 'VITE_SUPABASE_PUBLISHABLE_KEY' && !value.startsWith('sb_publishable_')) {
      throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must contain a Supabase Publishable Key.');
    }
  }
}
