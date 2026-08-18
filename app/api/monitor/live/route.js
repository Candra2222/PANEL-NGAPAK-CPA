import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rangeBounds } from "@/lib/conversion-day";

export const dynamic = "force-dynamic";

const TRAFFIC_COLS_APP =
  "id, redirect_id, sub_id, country, region, city, postal_code, browser_app, os_device, app, ip_address, created_at";
const TRAFFIC_COLS =
  "id, redirect_id, sub_id, country, region, city, postal_code, browser_app, os_device, ip_address, created_at";
const TRAFFIC_COLS_CITY =
  "id, redirect_id, sub_id, country, city, browser_app, os_device, ip_address, created_at";
const TRAFFIC_COLS_MIN =
  "id, redirect_id, sub_id, country, browser_app, os_device, ip_address, created_at";
const CONV_COLS_APP =
  "id, redirect_id, sub_id, network_name, country, earning, ip_address, browser_app, os_device, app, created_at";
const CONV_COLS =
  "id, redirect_id, sub_id, network_name, country, earning, ip_address, browser_app, os_device, created_at";

async function enrichConversionsIp(supabase, convs, fromISO, toISO) {
  const missing = convs.filter((c) => !c.ip_address);
  if (!missing.length) return convs;

  const subIds = [...new Set(missing.map((c) => c.sub_id).filter(Boolean))];
  const trafficBySub = new Map();

  await Promise.all(
    subIds.map(async (sid) => {
      const { data } = await supabase
        .from("traffic_logs")
        .select("sub_id, ip_address, created_at")
        .eq("sub_id", sid)
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: true });
      if (data) trafficBySub.set(sid, data);
    })
  );

  return convs.map((c) => {
    if (c.ip_address) return c;
    const logs = trafficBySub.get(c.sub_id);
    if (!logs || !logs.length) return c;
    const convTime = new Date(c.created_at).getTime();
    let best = logs[0];
    let bestDiff = Math.abs(convTime - new Date(best.created_at).getTime());
    for (let i = 1; i < logs.length; i++) {
      const diff = Math.abs(convTime - new Date(logs[i].created_at).getTime());
      if (diff < bestDiff) {
        best = logs[i];
        bestDiff = diff;
      }
    }
    return bestDiff <= 60 * 60 * 1000 ? { ...c, ip_address: best.ip_address } : c;
  });
}

export async function GET(request) {
  const { session } = await requireSession("monitor");
  if (!session) return error("Belum login.", 401);

  const q = request.nextUrl.searchParams;
  const range = q.get("range") || "today";
  const subId = q.get("sub_id") || null;
  const since = q.get("since") || null;
  const { fromISO, toISO } = rangeBounds(range, q.get("from"), q.get("to"));

  let sinceISO = fromISO;
  if (since && !isNaN(new Date(since).getTime())) {
    const candidate = new Date(since).toISOString();
    if (candidate > fromISO) sinceISO = candidate;
  }

  const supabase = supabaseAdmin();

  const buildConvQuery = (cols) => {
    let q = supabase
      .from("conversions")
      .select(cols)
      .gte("created_at", sinceISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false });
    if (subId && subId !== "all") q = q.eq("sub_id", subId);
    return q;
  };

  const buildTrafficQuery = (cols) => {
    let q = supabase
      .from("traffic_logs")
      .select(cols)
      .gte("created_at", sinceISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false })
      .limit(100);
    if (subId && subId !== "all") q = q.eq("sub_id", subId);
    return q;
  };

  let [trafficRes, convRes] = await Promise.all([
    buildTrafficQuery(TRAFFIC_COLS_APP),
    buildConvQuery(CONV_COLS_APP),
  ]);
  if (trafficRes.error) trafficRes = await buildTrafficQuery(TRAFFIC_COLS);
  if (trafficRes.error) trafficRes = await buildTrafficQuery(TRAFFIC_COLS_CITY);
  if (trafficRes.error) trafficRes = await buildTrafficQuery(TRAFFIC_COLS_MIN);
  if (convRes.error) convRes = await buildConvQuery(CONV_COLS);
  if (trafficRes.error || convRes.error) {
    return error("Gagal memuat data.", 500, {
      detail: (trafficRes.error || convRes.error).message,
    });
  }

  const convs = convRes.data || [];
  const enrichedConvs = await enrichConversionsIp(supabase, convs, sinceISO, toISO);

  return json({
    sinceISO,
    traffic: trafficRes.data || [],
    conversions: enrichedConvs,
  });
}
