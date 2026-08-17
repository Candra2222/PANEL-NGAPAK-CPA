import { error, json, requireSession, setSessionCookie, clearSessionCookie } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { comparePassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { ensureMonitorAccess } from "@/lib/bootstrap";

export async function GET() {
  const { session } = await requireSession("monitor");
  if (!session) return error("Belum login.", 401);
  return json({ ok: true, session: { role: "monitor", name: "Monitor" } });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === "logout") {
    const response = json({ ok: true });
    clearSessionCookie(response, "monitor");
    return response;
  }

  const ip = clientIp(request);
  const limit = await checkRateLimit(`login:monitor:${ip}`, 8, 60);
  if (!limit.ok) {
    return error("Terlalu banyak percobaan. Coba lagi nanti.", 429, { retryAfter: limit.retryAfter });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) return error("Password wajib diisi.", 400);

  try {
    await ensureMonitorAccess();
  } catch (e) {
    return error("Gagal menginisialisasi kredensial monitor.", 500, { detail: e.message });
  }

  const supabase = supabaseAdmin();
  const { data, error: dbError } = await supabase
    .from("monitor_access")
    .select("id, password_hash")
    .limit(1)
    .maybeSingle();
  if (dbError) return error("Gagal memuat kredensial.", 500, { detail: dbError.message });

  const res = await comparePassword(password, data?.password_hash || "");
  if (res.legacy) {
    return error("Kredensial monitor belum dimigrasi — jalankan migrasi password dulu.", 401);
  }
  if (!res.ok) return error("Password salah.", 401);

  const token = await createSession("monitor", { name: "Monitor" });
  const response = json({ ok: true, session: { role: "monitor", name: "Monitor" } });
  return setSessionCookie(response, "monitor", token);
}
