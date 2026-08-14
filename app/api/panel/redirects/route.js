import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidUrl, randomSlug } from "@/lib/links";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LEN = 64;

function cleanSlug(value) {
  return (value || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  const { session } = await requireSession("panel");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();

  const { data: panel, error: panelError } = await supabase
    .from("panels")
    .select("id, sub_id, panel_name, smartlink_url, is_active")
    .eq("id", session.panel_id)
    .maybeSingle();
  if (panelError) return error("Gagal memuat member.", 500);
  if (!panel || !panel.is_active) return error("Akun member dinonaktifkan.", 403);

  const { data, error: dbError } = await supabase
    .from("redirects")
    .select("id, sub_id, slug, destination_url, link_name, og_title, og_description, og_image, domain, redirect_mode, clicks, created_at")
    .eq("panel_id", session.panel_id)
    .order("created_at", { ascending: false });
  if (dbError) return error("Gagal memuat daftar link.", 500, { detail: dbError.message });

  const { data: convs, error: convError } = await supabase
    .from("conversions")
    .select("earning")
    .eq("panel_id", session.panel_id);
  if (convError) return error("Gagal memuat statistik.", 500);

  const redirects = data || [];
  const clicks = redirects.reduce((s, r) => s + (r.clicks || 0), 0);
  const earning = (convs || []).reduce((s, c) => s + Number(c.earning || 0), 0);

  return json({
    redirects,
    stats: {
      links: redirects.length,
      clicks,
      conversions: (convs || []).length,
      earning: parseFloat(earning.toFixed(2)),
    },
    panel: {
      panel_name: panel.panel_name,
      sub_id: panel.sub_id,
      smartlink_url: panel.smartlink_url,
    },
  });
}

export async function POST(request) {
  const { session } = await requireSession("panel");
  if (!session) return error("Unauthorized.", 401);

  const body = await request.json().catch(() => ({}));
  const type = body.type === "bulk" ? "bulk" : "single";
  const count = Math.min(100, Math.max(1, parseInt(body.count, 10) || 1));

  const domain = typeof body.domain === "string" && body.domain.trim() ? body.domain.trim() : "";
  const redirectMode = body.redirect_mode === "spinner" ? "spinner" : "direct";
  const ogTitle = typeof body.og_title === "string" ? body.og_title.trim().slice(0, 200) : "";
  const ogDescription = typeof body.og_description === "string" ? body.og_description.trim().slice(0, 500) : "";
  const ogImage = typeof body.og_image === "string" ? body.og_image.trim().slice(0, 1000) : "";

  const supabase = supabaseAdmin();
  const { data: panel, error: panelError } = await supabase
    .from("panels")
    .select("id, sub_id, panel_name, smartlink_url, is_active")
    .eq("id", session.panel_id)
    .maybeSingle();
  if (panelError) return error("Gagal memuat member.", 500);
  if (!panel || !panel.is_active) return error("Akun member dinonaktifkan.", 403);

  const destination = panel.smartlink_url || "";
  if (!destination || !isValidUrl(destination)) {
    return error("Smartlink member belum diatur oleh admin.", 400);
  }

  // Ambil slug yang sudah terpakai untuk hindari duplikasi.
  const { data: existing } = await supabase.from("redirects").select("slug");
  const used = new Set((existing || []).map((r) => r.slug));

  const rows = [];
  for (let i = 0; i < count; i++) {
    let slug = "";
    if (type === "single" && body.slug) {
      slug = cleanSlug(body.slug);
      if (slug.length > MAX_SLUG_LEN) return error("Slug terlalu panjang (maks. 64 karakter).", 400);
      if (!SLUG_RE.test(slug)) return error("Slug hanya boleh huruf kecil, angka, dan tanda strip.", 400);
    } else {
      slug = randomSlug(6);
      while (used.has(slug)) slug = randomSlug(6);
    }
    if (used.has(slug)) return error(`Slug "${slug}" sudah dipakai.`, 409);
    used.add(slug);

    rows.push({
      panel_id: panel.id,
      sub_id: panel.sub_id,
      slug,
      destination_url: destination,
      link_name: type === "bulk" ? `${panel.sub_id} ${i + 1}`.trim() : (body.link_name || panel.sub_id),
      og_title: ogTitle,
      og_description: ogDescription,
      og_image: ogImage,
      domain,
      redirect_mode: redirectMode,
    });
  }

  const { data: created, error: insertError } = await supabase
    .from("redirects")
    .insert(rows)
    .select("id, sub_id, slug, destination_url, link_name, domain, redirect_mode, clicks, created_at");
  if (insertError) return error("Gagal membuat link.", 500, { detail: insertError.message });

  return json({ ok: true, redirects: created || [] });
}

export async function DELETE() {
  const { session } = await requireSession("panel");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();

  const { data: panel, error: panelError } = await supabase
    .from("panels")
    .select("id, is_active")
    .eq("id", session.panel_id)
    .maybeSingle();
  if (panelError) return error("Gagal memuat member.", 500);
  if (!panel || !panel.is_active) return error("Akun member dinonaktifkan.", 403);

  const { error: deleteError } = await supabase
    .from("redirects")
    .delete()
    .eq("panel_id", session.panel_id);
  if (deleteError) return error("Gagal menghapus semua link.", 500, { detail: deleteError.message });

  return json({ ok: true });
}
