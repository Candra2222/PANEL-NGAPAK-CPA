import { error, json, requireSession, setSessionCookie, clearSessionCookie } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { comparePassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

function sessionPayload(p, request) {
  return {
    panel_id: p.id,
    sub_id: p.sub_id,
    panel_name: p.panel_name,
    domains: redirectDomains(request),
  };
}

function redirectDomains(request) {
  const env = process.env.REDIRECT_DOMAINS;
  if (env) return env.split(",").map((d) => d.trim()).filter(Boolean);
  if (process.env.REDIRECT_DOMAIN) return [process.env.REDIRECT_DOMAIN];
  try {
    return [new URL(request.url).host];
  } catch {
    return [];
  }
}

export async function GET(request) {
  const { session } = await requireSession("panel");
  if (!session) return error("Belum login.", 401);

  const supabase = supabaseAdmin();
  const { data: panel, error: dbError } = await supabase
    .from("panels")
    .select("id, sub_id, panel_name, is_active")
    .eq("id", session.panel_id)
    .maybeSingle();
  if (dbError || !panel || !panel.is_active) return error("Sesi tidak valid.", 401);

  return json({ ok: true, session: sessionPayload(panel, request) });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === "logout") {
    const response = json({ ok: true });
    clearSessionCookie(response, "panel");
    return response;
  }

  const ip = clientIp(request);
  const limit = await checkRateLimit(`login:panel:${ip}`, 8, 60);
  if (!limit.ok) {
    return error("Terlalu banyak percobaan. Coba lagi nanti.", 429, { retryAfter: limit.retryAfter });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) return error("Password wajib diisi.", 400);

  const supabase = supabaseAdmin();
  const { data: panels, error: dbError } = await supabase
    .from("panels")
    .select("id, sub_id, panel_name, password_hash, is_active")
    .eq("is_active", true);
  if (dbError) return error("Gagal memuat kredensial.", 500, { detail: dbError.message });

  let matched = null;
  let sawLegacy = false;
  for (const p of panels || []) {
    const res = await comparePassword(password, p.password_hash);
    if (res.legacy) {
      sawLegacy = true;
      continue;
    }
    if (res.ok) {
      matched = p;
      break;
    }
  }

  if (!matched && sawLegacy) {
    return error("Ada password member yang belum dimigrasi — hubungi admin untuk reset password.", 401);
  }
  if (!matched) return error("Password salah atau Sub ID dinonaktifkan.", 401);

  await supabase.from("panels").update({ last_login_at: new Date().toISOString() }).eq("id", matched.id);

  const token = await createSession("panel", {
    panel_id: matched.id,
    sub_id: matched.sub_id,
    panel_name: matched.panel_name,
  });
  const response = json({ ok: true, session: sessionPayload(matched, request) });
  return setSessionCookie(response, "panel", token);
}
