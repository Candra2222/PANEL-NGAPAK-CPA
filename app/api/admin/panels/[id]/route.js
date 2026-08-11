import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { randomPassword } from "@/lib/links";

export async function GET(_request, { params }) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: panel, error: panelError } = await supabase
    .from("panels")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (panelError) return error("Gagal memuat member.", 500, { detail: panelError.message });
  if (!panel) return error("Member tidak ditemukan.", 404);

  const { data: redirects, error: redirectsError } = await supabase
    .from("redirects")
    .select("id, slug, link_name, destination_url, domain, clicks, created_at")
    .eq("panel_id", id)
    .order("created_at", { ascending: false });
  if (redirectsError) return error("Gagal memuat link.", 500);

  const { data: conversionsEarn, error: convError } = await supabase
    .from("conversions")
    .select("earning")
    .eq("panel_id", id);
  if (convError) return error("Gagal memuat konversi.", 500);

  const { data: conversions, error: recentError } = await supabase
    .from("conversions")
    .select("network_name, country, earning, created_at")
    .eq("panel_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (recentError) return error("Gagal memuat konversi terbaru.", 500);

  const { data: traffic, error: trafficError } = await supabase
    .from("traffic_logs")
    .select("ip_address, country, browser_app, os_device, created_at")
    .eq("panel_id", id)
    .order("created_at", { ascending: false })
    .limit(6);
  if (trafficError) return error("Gagal memuat traffic.", 500);

  const clicks = redirects.reduce((s, r) => s + r.clicks, 0);
  const earning = (conversionsEarn || []).reduce((s, c) => s + Number(c.earning || 0), 0);

  return json({
    panel: {
      id: panel.id,
      sub_id: panel.sub_id,
      panel_name: panel.panel_name,
      smartlink_url: panel.smartlink_url,
      is_active: panel.is_active,
      created_at: panel.created_at,
      last_login_at: panel.last_login_at,
      links: redirects.length,
      clicks,
      conversions: (conversionsEarn || []).length,
      earning: parseFloat(earning.toFixed(2)),
    },
    redirects,
    conversions,
    traffic,
  });
}

export async function PATCH(request, { params }) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = supabaseAdmin();

  const { data: panel, error: loadError } = await supabase
    .from("panels")
    .select("id, sub_id")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return error("Gagal memuat member.", 500);
  if (!panel) return error("Member tidak ditemukan.", 404);

  // Reset password Panel 2
  if (body.action === "reset-password") {
    const newPassword = typeof body.password === "string" ? body.password.trim() : "";
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`, 400);
    }
    const { error: updateError } = await supabase
      .from("panels")
      .update({ password_hash: await hashPassword(newPassword) })
      .eq("id", id);
    if (updateError) return error("Gagal reset password.", 500, { detail: updateError.message });
    return json({ ok: true, sub_id: panel.sub_id, password: newPassword });
  }

  // Aktifkan / nonaktifkan
  if (body.action === "toggle-active") {
    const isActive = body.is_active === true;
    const { error: updateError } = await supabase
      .from("panels")
      .update({ is_active: isActive })
      .eq("id", id);
    if (updateError) return error("Gagal mengubah status.", 500, { detail: updateError.message });
    return json({ ok: true, is_active: isActive });
  }

  // Generate ulang password otomatis
  if (body.action === "generate-password") {
    const newPassword = randomPassword();
    const { error: updateError } = await supabase
      .from("panels")
      .update({ password_hash: await hashPassword(newPassword) })
      .eq("id", id);
    if (updateError) return error("Gagal membuat password.", 500, { detail: updateError.message });
    return json({ ok: true, sub_id: panel.sub_id, password: newPassword });
  }

  return error("Aksi tidak dikenal.", 400);
}

export async function DELETE(_request, { params }) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { error: deleteError } = await supabase.from("panels").delete().eq("id", id);
  if (deleteError) return error("Gagal menghapus member.", 500, { detail: deleteError.message });

  return json({ ok: true });
}
