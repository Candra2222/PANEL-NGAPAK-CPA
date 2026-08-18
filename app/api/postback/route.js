import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Endpoint postback dari Trafee (GET maupun POST).
 * Jika sub_id cocok dengan salah satu panel, panel_id ikut dicatat.
 * Jika tidak cocok, tetap disimpan sebagai "Unmatched" untuk dicek admin.
 */
export async function handler(request) {
  const supabase = supabaseAdmin();

  let subId = null;
  let earning = 0;
  let country = null;
  let ip = null;
  let browser = null;
  let os = null;
  let app = null;

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      subId = body.sub_id || body.subid || body.sub || null;
      earning = Number(body.earning || body.payout || body.commission || 0);
      country = body.country || null;
      ip = body.ip || body.ip_address || null;
      browser = body.browser || body.browser_app || null;
      os = body.os || body.os_device || null;
      app = body.app || body.app_name || null;
    } else {
      const form = await request.formData().catch(() => new FormData());
      subId = form.get("sub_id") || form.get("subid") || form.get("sub") || null;
      earning = Number(form.get("earning") || form.get("payout") || form.get("commission") || 0);
      country = form.get("country") || null;
      ip = form.get("ip") || form.get("ip_address") || null;
      browser = form.get("browser") || form.get("browser_app") || null;
      os = form.get("os") || form.get("os_device") || null;
      app = form.get("app") || form.get("app_name") || null;
    }
  } else {
    const q = request.nextUrl.searchParams;
    subId = q.get("sub_id") || q.get("subid") || q.get("sub") || null;
    earning = Number(q.get("earning") || q.get("payout") || q.get("commission") || 0);
    country = q.get("country") || null;
    ip = q.get("ip") || q.get("ip_address") || null;
    browser = q.get("browser") || q.get("browser_app") || null;
    os = q.get("os") || q.get("os_device") || null;
    app = q.get("app") || q.get("app_name") || null;
  }

  if (!subId) return json({ ok: false, error: "sub_id wajib." }, { status: 400 });

  const requestIp = clientIp(request);
  const limit = await checkRateLimit(`postback:${requestIp}`, 60, 60);
  if (!limit.ok) {
    return json({ ok: false, error: "Rate limited." }, { status: 429 });
  }

  const token = process.env.POSTBACK_TOKEN;
  if (token) {
    const provided = request.headers.get("x-postback-token") || request.nextUrl.searchParams.get("token");
    if (provided !== token) {
      return json({ ok: false, error: "Token tidak valid." }, { status: 401 });
    }
  }

  // Cari panel dari sub_id.
  const { data: panel, error: panelError } = await supabase
    .from("panels")
    .select("id")
    .eq("sub_id", subId)
    .maybeSingle();
  if (panelError) {
    return json({ ok: false, error: "Gagal memuat panel." }, { status: 500 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: trafficLogs } = await supabase
    .from("traffic_logs")
    .select("app, browser_app, os_device, ip_address, created_at")
    .eq("sub_id", subId)
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false });

  const nowTs = Date.now();
  const lastTraffic = trafficLogs?.length
    ? trafficLogs.reduce((best, row) => {
        const diff = Math.abs(nowTs - new Date(row.created_at).getTime());
        return diff < best.diff ? { row, diff } : best;
      }, { row: trafficLogs[0], diff: Infinity }).row
    : null;

  const insert = {
    panel_id: panel?.id || null,
    sub_id: subId,
    network_name: "Trafee",
    country: country || null,
    earning: isFinite(earning) && earning > 0 ? earning : 0,
    ip_address: ip || lastTraffic?.ip_address || null,
    browser_app: browser || lastTraffic?.browser_app || null,
    os_device: os || lastTraffic?.os_device || null,
    app: app || lastTraffic?.app || null,
  };
  let { error: insertError } = await supabase.from("conversions").insert(insert);
  if (insertError && app) {
    const { app: _app, ...fallback } = insert;
    ({ error: insertError } = await supabase.from("conversions").insert(fallback));
  }

  if (insertError) {
    return json({ ok: false, error: "Gagal menyimpan konversi." }, { status: 500 });
  }

  return json({ ok: true, matched: !!panel });
}

export { handler as GET, handler as POST };
