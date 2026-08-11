import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rangeBounds } from "@/lib/conversion-day";

export const dynamic = "force-dynamic";

const TRAFFIC_COLS =
  "id, redirect_id, sub_id, country, browser_app, os_device, ip_address, created_at";
const CONV_COLS =
  "id, redirect_id, sub_id, network_name, country, earning, ip_address, browser_app, os_device, created_at";

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

  let trafficQuery = supabase
    .from("traffic_logs")
    .select(TRAFFIC_COLS)
    .gte("created_at", sinceISO)
    .lte("created_at", toISO)
    .order("created_at", { ascending: false })
    .limit(100);

  let convQuery = supabase
    .from("conversions")
    .select(CONV_COLS)
    .gte("created_at", sinceISO)
    .lte("created_at", toISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (subId && subId !== "all") {
    trafficQuery = trafficQuery.eq("sub_id", subId);
    convQuery = convQuery.eq("sub_id", subId);
  }

  const [trafficRes, convRes] = await Promise.all([trafficQuery, convQuery]);
  if (trafficRes.error || convRes.error) {
    return error("Gagal memuat data.", 500, {
      detail: (trafficRes.error || convRes.error).message,
    });
  }

  return json({
    sinceISO,
    traffic: trafficRes.data || [],
    conversions: convRes.data || [],
  });
}
