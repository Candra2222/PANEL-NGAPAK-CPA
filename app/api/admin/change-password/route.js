import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, comparePassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export async function POST(request) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const body = await request.json().catch(() => ({}));
  const oldPassword = typeof body.old_password === "string" ? body.old_password : "";
  const newPassword = typeof body.new_password === "string" ? body.new_password : "";

  if (!oldPassword || !newPassword) return error("Password lama & baru wajib diisi.", 400);
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return error(`Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`, 400);
  }
  if (newPassword === oldPassword) {
    return error("Password baru harus berbeda dari password lama.", 400);
  }

  const supabase = supabaseAdmin();
  const { data, error: loadError } = await supabase
    .from("admin_access")
    .select("id, password_hash")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (loadError) return error("Gagal memuat kredensial.", 500);

  const match = await comparePassword(oldPassword, data?.password_hash || "");
  if (!match) return error("Password lama salah.", 401);

  const { error: updateError } = await supabase
    .from("admin_access")
    .update({ password_hash: await hashPassword(newPassword) })
    .eq("id", data.id);
  if (updateError) return error("Gagal mengganti password.", 500, { detail: updateError.message });

  return json({ ok: true });
}
