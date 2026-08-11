import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { randomPassword } from "@/lib/links";

export async function GET() {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();
  const { data, error: dbError } = await supabase
    .from("monitor_access")
    .select("id, updated_at")
    .limit(1)
    .maybeSingle();
  if (dbError) return error("Gagal memuat status.", 500, { detail: dbError.message });

  return json({ exists: !!data, updated_at: data?.updated_at || null });
}

export async function POST(request) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const body = await request.json().catch(() => ({}));
  if (body.action !== "reset") return error("Aksi tidak dikenal.", 400);

  const manual = typeof body.password === "string" ? body.password.trim() : "";
  if (manual && manual.length < MIN_PASSWORD_LENGTH) {
    return error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`, 400);
  }
  const newPassword = manual || randomPassword();
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("monitor_access")
    .select("id")
    .limit(1)
    .maybeSingle();

  let updateError = null;
  if (existing) {
    const res = await supabase
      .from("monitor_access")
      .update({ password_hash: await hashPassword(newPassword) })
      .eq("id", existing.id);
    updateError = res.error;
  } else {
    const res = await supabase
      .from("monitor_access")
      .insert({ password_hash: await hashPassword(newPassword) });
    updateError = res.error;
  }

  if (updateError) return error("Gagal menyimpan password.", 500, { detail: updateError.message });

  return json({ ok: true, password: newPassword });
}
