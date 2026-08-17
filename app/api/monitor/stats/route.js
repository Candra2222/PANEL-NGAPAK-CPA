import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { startOfConversionDay, rangeBounds } from "@/lib/conversion-day";
import { groupBy, groupCount, sumWhere } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

const FEED_COLS_APP =
  "id, redirect_id, sub_id, country, region, city, postal_code, browser_app, os_device, app, ip_address, created_at";
const FEED_COLS =
  "id, redirect_id, sub_id, country, region, city, postal_code, browser_app, os_device, ip_address, created_at";
const FEED_COLS_CITY =
  "id, redirect_id, sub_id, country, city, browser_app, os_device, ip_address, created_at";
const FEED_COLS_MIN =
  "id, redirect_id, sub_id, country, browser_app, os_device, ip_address, created_at";

const CONV_COLS_APP =
  "id, redirect_id, sub_id, network_name, country, earning, ip_address, browser_app, os_device, app, created_at";
const CONV_COLS =
  "id, redirect_id, sub_id, network_name, country, earning, ip_address, browser_app, os_device, created_at";

async function fetchConversions(supabase, fromISO, toISO, subId) {
  const colsList = [CONV_COLS_APP, CONV_COLS];
  let lastError = null;
  for (const cols of colsList) {
    let q = supabase
      .from("conversions")
      .select(cols)
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false })
      .limit(100);
    if (subId && subId !== "all") q = q.eq("sub_id", subId);
    const { data, error } = await q;
    if (error) {
      lastError = error;
      continue;
    }
    return { data };
  }
  return { data: [], error: lastError };
}

async function fetchFeed(supabase, fromISO, toISO) {
  const build = (cols) =>
    supabase
      .from("traffic_logs")
      .select(cols)
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false })
      .limit(60);
  let res = await build(FEED_COLS_APP);
  if (res.error) res = await build(FEED_COLS);
  if (res.error) res = await build(FEED_COLS_CITY);
  if (res.error) res = await build(FEED_COLS_MIN);
  return res;
}

function aggregateReport(subIdList, trafficMap, convMap) {
  const map = new Map();
  (subIdList || []).forEach((sub) => {
    if (sub) map.set(sub, { sub_id: sub, network_name: "Trafee", clicks: 0, conversions: 0, earning: 0 });
  });
  trafficMap.forEach((count, sub) => {
    const cur = map.get(sub) || { sub_id: sub, network_name: "Trafee", clicks: 0, conversions: 0, earning: 0 };
    cur.clicks = count;
    map.set(sub, cur);
  });
  convMap.forEach((v, sub) => {
    const cur = map.get(sub) || { sub_id: sub, network_name: "Trafee", clicks: 0, conversions: 0, earning: 0 };
    cur.conversions = v.count;
    cur.earning += v.sum;
    map.set(sub, cur);
  });
  return [...map.values()]
    .map((v) => ({ ...v, earning: parseFloat(v.earning.toFixed(2)) }))
    .sort((a, b) => b.earning - a.earning);
}

export async function GET(request) {
  const { session } = await requireSession("monitor");
  if (!session) return error("Belum login.", 401);

  const q = request.nextUrl.searchParams;
  const range = q.get("range") || "today";
  const subId = q.get("sub_id") || null;
  const { fromISO, toISO } = rangeBounds(range, q.get("from"), q.get("to"));
  const todayStart = startOfConversionDay();
  const todayISO = new Date(todayStart).toISOString();

  const supabase = supabaseAdmin();
  const errors = [];

  const [feedRes, convRes, subIdListRes, redirectsRes] = await Promise.all([
    fetchFeed(supabase, fromISO, toISO),
    fetchConversions(supabase, fromISO, toISO, subId),
    supabase.from("panels").select("sub_id"),
    supabase.from("redirects").select("id, destination_url, sub_id"),
  ]);

  let feed = feedRes.data || [];
  let convs = convRes.data || [];
  if (feedRes.error) errors.push(feedRes.error.message);
  if (convRes.error) errors.push(convRes.error.message);

  const subIds = [...new Set((subIdListRes.data || []).map((p) => p.sub_id).filter(Boolean))];
  const redirectById = {};
  (redirectsRes.data || []).forEach((r) => {
    redirectById[r.id] = { destination_url: r.destination_url, sub_id: r.sub_id };
  });

  const filteredFeed = subId && subId !== "all" ? feed.filter((t) => t.sub_id === subId) : feed;
  const filteredConvs = subId && subId !== "all" ? convs.filter((c) => c.sub_id === subId) : convs;

  const countTraffic = supabase
    .from("traffic_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fromISO)
    .lte("created_at", toISO);
  const countConvs = supabase
    .from("conversions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fromISO)
    .lte("created_at", toISO);
  if (subId && subId !== "all") {
    countTraffic.eq("sub_id", subId);
    countConvs.eq("sub_id", subId);
  }
  const [trafficCount, convCount] = await Promise.all([countTraffic, countConvs]);

  const rangeFilter = (qq) => qq.gte("created_at", fromISO).lte("created_at", toISO);

  const [reportTraffic, reportConvs, topToday, topCountries, allEarning] = await Promise.all([
    groupCount("traffic_logs", "sub_id", rangeFilter),
    groupBy("conversions", "sub_id", "earning", rangeFilter),
    groupBy("conversions", "sub_id", "earning", (qq) => qq.gte("created_at", todayISO)),
    groupCount("conversions", "country", (qq) => qq.gte("created_at", todayISO)),
    sumWhere("conversions", "earning"),
  ]);

  const report = aggregateReport(subIds, reportTraffic, reportConvs);

  const topTodayList = [...topToday.entries()]
    .map(([sub_id, v]) => ({ sub_id, conversions: v.count, earning: parseFloat(v.sum.toFixed(2)) }))
    .sort((a, b) => b.earning - a.earning)
    .slice(0, 10);

  const topCountriesList = [...topCountries.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totals = {
    clicks: trafficCount.count || 0,
    conversions: convCount.count || 0,
    earning: parseFloat(
      (
        subId && subId !== "all"
          ? reportConvs.get(subId)?.sum || 0
          : [...reportConvs.values()].reduce((s, v) => s + v.sum, 0)
      ).toFixed(2)
    ),
  };

  if (errors.length && !feed.length && !convs.length) {
    return error("Gagal memuat data.", 500, { detail: errors[0] });
  }

  return json({
    range,
    fromISO,
    toISO,
    totals,
    allEarning,
    feed: filteredFeed,
    conversions: filteredConvs,
    report,
    topToday: topTodayList,
    topCountries: topCountriesList,
    subIds,
    redirectById,
  });
}
