import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { detectSubIdParams, isValidUrl, randomPassword } from "@/lib/links";

export async function GET() {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();

  const { data: panels, error: panelsError } = await supabase
    .from("panels")
    .select("*")
    .order("created_at", { ascending: false });
  if (panelsError) return error("Gagal memuat daftar member.", 500, { detail: panelsError.message });

  const { data: redirects, error: redirectsError } = await supabase
    .from("redirects")
    .select("panel_id, clicks");
  if (redirectsError) return error("Gagal memuat statistik link.", 500);

  const { data: conversions, error: conversionsError } = await supabase
    .from("conversions")
    .select("panel_id, earning");
  if (conversionsError) return error("Gagal memuat statistik konversi.", 500);

  const linksByPanel = {};
  redirects.forEach((r) => {
    if (!r.panel_id) return;
    linksByPanel[r.panel_id] = linksByPanel[r.panel_id] || { links: 0, clicks: 0 };
    linksByPanel[r.panel_id].links += 1;
    linksByPanel[r.panel_id].clicks += r.clicks || 0;
  });

  const convByPanel = {};
  conversions.forEach((c) => {
    if (!c.panel_id) return;
    convByPanel[c.panel_id] = convByPanel[c.panel_id] || { conversions: 0, earning: 0 };
    convByPanel[c.panel_id].conversions += 1;
    convByPanel[c.panel_id].earning += Number(c.earning || 0);
  });

  const list = (panels || []).map((p) => ({
    id: p.id,
    sub_id: p.sub_id,
    panel_name: p.panel_name,
    smartlink_url: p.smartlink_url,
    is_active: p.is_active,
    created_at: p.created_at,
    last_login_at: p.last_login_at,
    links: linksByPanel[p.id]?.links || 0,
    clicks: linksByPanel[p.id]?.clicks || 0,
    conversions: convByPanel[p.id]?.conversions || 0,
    earning: parseFloat((convByPanel[p.id]?.earning || 0).toFixed(2)),
  }));

  return json({ panels: list });
}

export async function POST(request) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const body = await request.json().catch(() => ({}));
  const smartlinkUrl = typeof body.smartlink_url === "string" ? body.smartlink_url.trim() : "";
  const manualPassword = typeof body.password === "string" ? body.password.trim() : "";

  if (!smartlinkUrl) return error("URL Smartlink wajib diisi.", 400);
  if (!isValidUrl(smartlinkUrl)) return error("URL Smartlink tidak valid.", 400);

  const params = detectSubIdParams(smartlinkUrl);
  const subId = params[0]?.value;
  if (!subId) {
    return error("Sub ID tidak terdeteksi dari URL Smartlink.", 400);
  }
  if (subId.length > 80) return error("Sub ID terlalu panjang (maks. 80 karakter).", 400);

  let password = manualPassword;
  if (!password) password = randomPassword();
  if (password.length < MIN_PASSWORD_LENGTH) {
    return error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`, 400);
  }

  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("panels")
    .select("id")
    .eq("sub_id", subId)
    .maybeSingle();
  if (existing) return error(`Sub ID "${subId}" sudah terdaftar.`, 409);

  const { data: created, error: insertError } = await supabase
    .from("panels")
    .insert({
      sub_id: subId,
      panel_name: subId,
      smartlink_url: smartlinkUrl,
      password_hash: await hashPassword(password),
      is_active: true,
    })
    .select()
    .single();
  if (insertError) return error("Gagal membuat Sub ID.", 500, { detail: insertError.message });

  return json({
    panel: {
      id: created.id,
      sub_id: created.sub_id,
      panel_name: created.panel_name,
      smartlink_url: created.smartlink_url,
      is_active: created.is_active,
      created_at: created.created_at,
      last_login_at: null,
      links: 0,
      clicks: 0,
      conversions: 0,
      earning: 0,
    },
    password,
  });
}
