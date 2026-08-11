const KEY = "cpa-demo-key-2026";
const PREFIX = "enc:v1:";

function xorBytes(bytes, key) {
  return bytes.map((b, i) => b ^ key.charCodeAt(i % key.length));
}

export function encryptPassword(pw) {
  if (!pw) return "";
  const bytes = new TextEncoder().encode(pw);
  const xored = xorBytes(bytes, KEY);
  return PREFIX + btoa(String.fromCharCode(...xored));
}

export function decryptPassword(enc) {
  if (!enc || !enc.startsWith(PREFIX)) return enc || "";
  try {
    const bin = atob(enc.slice(PREFIX.length));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const xored = xorBytes(bytes, KEY);
    return new TextDecoder().decode(new Uint8Array(xored));
  } catch {
    return enc;
  }
}
