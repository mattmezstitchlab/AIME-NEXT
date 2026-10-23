/** Identifiants stables : un préfixe lisible et 12 caractères aléatoires. Jamais réutilisés, jamais recalculés. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function nouvelId(prefixe: 'p' | 'c' | 'b' | 'm' | 'pg' | 's'): string {
  const octets = new Uint8Array(12);
  globalThis.crypto.getRandomValues(octets);
  let s = '';
  for (const o of octets) s += ALPHABET[o % ALPHABET.length];
  return `${prefixe}-${s}`;
}
