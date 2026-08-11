import { error, json, requireSession, setSessionCookie, clearSessionCookie } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { comparePassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { ensureAdminAccess } from "@/lib/bootstrap";

export async function GET() {
  const { session } = await requireSession("admin");
  if (!session) return error("Belum login.", 401);
  return json({ ok: true, session: { role: "admin", name: "Administrator" } });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === "logout") {
    const response = json({ ok: true });
    clearSessionCookie(response, "admin");
    return response;
  }

  const ip = clientIp(request);
  const limit = await checkRateLimit(`login:admin:${ip}`, 8, 60);
  if (!limit.ok) {
    return error("Terlalu banyak percobaan. Coba lagi nanti.", 429, {
      retryAfter: limit.retryAfter,
    });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) return error("Password wajib diisi.", 400);

  try {
    await ensureAdminAccess();
  } catch (e) {
    return error("Gagal menginisialisasi kredensial admin.", 500, { detail: e.message });
  }

  const supabase = supabaseAdmin();
  const { data, error: dbError } = await supabase
    .from("admin_access")
    .select("id, password_hash")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dbError) return error("Gagal memuat kredensial.", 500, { detail: dbError.message });

  const ok = await comparePassword(password, data?.password_hash || "");
  if (!ok) return error("Password salah.", 401);

  const token = await createSession("admin", { name: "Administrator" });
  const response = json({
    ok: true,
    session: { role: "admin", name: "Administrator" },
  });
  return setSessionCookie(response, "admin", token);
}
