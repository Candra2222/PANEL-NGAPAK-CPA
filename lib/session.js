import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAMES = {
  admin: "cpa_session_admin",
  panel: "cpa_session_panel",
  monitor: "cpa_session_monitor",
};

const TTL = {
  admin: "12h",
  panel: "12h",
  monitor: "12h",
};

function secret() {
  const s = process.env.AUTH_SECRET || "cpa-dev-secret-change-me-in-production";
  return new TextEncoder().encode(s);
}

export function sessionCookieName(type) {
  return COOKIE_NAMES[type] || COOKIE_NAMES.admin;
}

export async function createSession(type, payload) {
  return new SignJWT({ role: type, ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL[type] || "12h")
    .sign(secret());
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload && payload.role) return payload;
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 12 * 3600,
  };
}
