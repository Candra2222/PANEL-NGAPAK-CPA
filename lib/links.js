export const SUB_ID_PARAM_KEYS = [
  "sub_id", "subid", "sub", "sub1", "sub2", "s1", "s2", "sid",
  "aff_sub", "aff_sub1", "aff_sub2", "af_sub", "af_sub1",
  "clickid", "click_id", "ext_click_id", "traffic_source",
  "subsource", "sub_source", "track", "track_id", "trk",
  "cid", "adv_sub", "publisher_id", "pid", "utm_source", "utm_content",
];

export function detectSubIdParams(url) {
  if (!url) return [];
  try {
    const u = new URL(url.trim());
    const found = [];
    for (const key of SUB_ID_PARAM_KEYS) {
      const val = u.searchParams.get(key);
      if (val && val.trim()) found.push({ key, value: val.trim() });
    }
    if (found.length === 0) {
      for (const [key, val] of u.searchParams) {
        if (val && val.trim()) found.push({ key, value: val.trim() });
      }
    }
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length) found.push({ key: "path", value: decodeURIComponent(segments[segments.length - 1]) });
    return found;
  } catch {
    return [];
  }
}

export function extractSubIdFromUrl(url) {
  const params = detectSubIdParams(url);
  return params.length ? params[0].value : null;
}

export function isValidUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function randomSlug(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Nama cewek eropa (huruf kecil, tanpa aksen) untuk prefix subdomain acak. */
export const SUBDOMAIN_NAMES = [
  "emma", "sophia", "olivia", "ava", "isabella", "mia", "charlotte", "amelia",
  "luna", "ella", "scarlett", "grace", "chloe", "camila", "victoria", "hannah",
  "layla", "zoe", "violet", "elena", "alice", "julia", "sophie", "emily",
  "isabelle", "lucy", "eva", "nora", "sofia", "alexa", "elise", "clara",
  "lara", "lea", "sarah", "lena", "anna", "marie", "annette", "giselle",
  "helene", "ines", "janine", "karin", "lotte", "maren", "noemi", "paula",
  "ronja", "thea", "ursula", "yvonne",
];

export const SUBDOMAIN_PREFIX_RE = /^[a-z]{2,20}-[a-z0-9]{4}$/;

/** Prefix subdomain acak: nama cewek eropa + kode unik 4 karakter (misal emma-k7x2). */
export function randomSubdomainPrefix() {
  const name = SUBDOMAIN_NAMES[Math.floor(Math.random() * SUBDOMAIN_NAMES.length)];
  return `${name}-${randomSlug(4)}`;
}

/** Domain redirect untuk link member (env REDIRECT_DOMAIN atau fallback). */
export function redirectDomain() {
  return process.env.REDIRECT_DOMAIN || "fumifun.sbs";
}

export function fullLink(slug, domain = redirectDomain()) {
  return `https://${domain}/${slug}`;
}
