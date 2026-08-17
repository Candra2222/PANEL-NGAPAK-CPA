import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function collectParams(req) {
  const params = new URLSearchParams();
  const q = new URL(req.url).searchParams;
  for (const [k, v] of q) params.set(k, v);

  if (req.method === "POST") {
    const ct = req.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        const body = await req.json();
        for (const [k, v] of Object.entries(body || {})) {
          if (v !== null && v !== undefined) params.set(k, String(v));
        }
      } else {
        const form = await req.formData();
        for (const [k, v] of form) params.set(k, String(v));
      }
    } catch {
      // abaikan body tak valid
    }
  }
  return params;
}

const pick = (params, names) => {
  for (const n of names) {
    const v = params.get(n);
    if (v) return v;
  }
  return null;
};

const toNum = (v) => {
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : 0;
};

async function rateLimited(key) {
  const now = new Date();
  const windowMs = 60 * 1000;
  const { data: row } = await supabase.from("rate_limits").select("count, window_start").eq("key", key).maybeSingle();
  if (row) {
    const windowStart = new Date(row.window_start);
    if (now.getTime() - windowStart.getTime() > windowMs) {
      await supabase.from("rate_limits").update({ count: 1, window_start: now.toISOString(), updated_at: now.toISOString() }).eq("key", key);
      return false;
    }
    if (row.count >= 60) return true;
    await supabase.from("rate_limits").update({ count: Number(row.count) + 1, updated_at: now.toISOString() }).eq("key", key);
    return false;
  }
  await supabase.from("rate_limits").insert({ key, count: 1, window_start: now.toISOString() });
  return false;
}

Deno.serve(async (req) => {
  const params = await collectParams(req);

  const subId = pick(params, ["sub_id", "subsource", "sub_source", "subid", "sub"]);
  if (!subId) return json({ ok: false, error: "sub_id wajib." }, 400);

  const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
  if (await rateLimited(`postback:${clientIp}`)) {
    return json({ ok: false, error: "Rate limited." }, 429);
  }

  const { data: panel, error: panelError } = await supabase
    .from("panels")
    .select("id")
    .eq("sub_id", subId)
    .maybeSingle();
  if (panelError) return json({ ok: false, error: "Gagal memuat panel." }, 500);

  const insert = {
    panel_id: panel?.id || null,
    sub_id: subId,
    network_name: pick(params, ["network"]) || "Trafee",
    country: pick(params, ["country"]) || null,
    earning: toNum(pick(params, ["earning", "payout", "sum", "commission"])),
    ip_address: pick(params, ["ip", "ip_address"]) || (clientIp !== "unknown" ? clientIp : null),
    browser_app: pick(params, ["browser", "browser_app"]) || null,
    os_device: pick(params, ["os", "os_device"]) || null,
    app: pick(params, ["app", "app_name"]) || null,
  };

  const { error: insertError } = await supabase.from("conversions").insert(insert);
  if (insertError) return json({ ok: false, error: "Gagal menyimpan konversi." }, 500);

  return json({ ok: true, matched: !!panel });
});
