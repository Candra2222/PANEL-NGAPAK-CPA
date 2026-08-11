import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionCookieName, sessionCookieOptions, verifySession } from "./session";

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function error(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Baca & verifikasi session dari httpOnly cookie. */
export async function requireSession(type) {
  const store = await cookies();
  const token = store.get(sessionCookieName(type))?.value;
  if (!token) return { session: null };
  const session = await verifySession(token);
  if (!session || session.role !== type) return { session: null };
  return { session };
}

/** Set cookie session di response. */
export async function setSessionCookie(response, type, token) {
  const store = await cookies();
  store.set(sessionCookieName(type), token, sessionCookieOptions());
  return response;
}

export function clearSessionCookie(response, type) {
  response.cookies.delete(sessionCookieName(type));
  return response;
}
