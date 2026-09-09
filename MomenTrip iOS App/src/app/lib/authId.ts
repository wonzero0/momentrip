const INTERNAL_AUTH_DOMAIN = 'momentrip.app';

function normalizeId(id: string) {
  return id.trim().toLowerCase();
}

function toHex(value: string) {
  return Array.from(new TextEncoder().encode(value))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function idToAuthEmail(id: string) {
  const normalized = normalizeId(id);
  if (normalized.includes('@')) return normalized;
  return `user-${toHex(normalized)}@${INTERNAL_AUTH_DOMAIN}`;
}

export function isValidLoginId(id: string) {
  const normalized = normalizeId(id);
  return /^[\p{L}\p{N}._-]{3,40}$/u.test(normalized);
}
