const PREFIX = "sha256$";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isFastHash(hash) {
  return typeof hash === "string" && hash.startsWith(PREFIX);
}

/** Hash cepat (SHA-256 + salt) aman untuk budget CPU Cloudflare Workers. */
export async function hashPassword(password) {
  const salt = randomSalt();
  const hash = await sha256Hex(`${salt}:${password}`);
  return `${PREFIX}${salt}$${hash}`;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isLegacyHash(hash) {
  return typeof hash === "string" && /^\$2[aby]\$\d{2}\$/.test(hash);
}

/**
 * Verifikasi password.
 * Hanya hash format `sha256$` yang diverifikasi di Worker (sub-ms CPU).
 * Hash lama (bcrypt) TIDAK diverifikasi di Worker karena bcrypt jauh
 * melewati budget CPU Cloudflare (10ms) -> Error 1102. Kembalikan
 * `legacy: true` agar pemanggil memberi pesan "reset password / migrasi".
 */
export async function comparePassword(password, hash) {
  if (!password || !hash) return { ok: false, legacy: false };

  if (isFastHash(hash)) {
    const parts = hash.slice(PREFIX.length).split("$");
    if (parts.length !== 2) return { ok: false, legacy: false };
    const actual = await sha256Hex(`${parts[0]}:${password}`);
    return { ok: constantTimeEqual(actual, parts[1]), legacy: false };
  }

  if (isLegacyHash(hash)) return { ok: false, legacy: true };

  return { ok: false, legacy: false };
}

export const MIN_PASSWORD_LENGTH = 3;
