import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { startOfConversionDay, rangeBounds } from "@/lib/conversion-day";

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
  const build = (cols) => {
    let q = supabase
      .from("conversions")
      .select(cols)
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false })
      .limit(200);
    if (subId && subId !== "all") q = q.eq("sub_id", subId);
    return q;
  };
  let res = await build(CONV_COLS_APP);
  if (res.error) res = await build(CONV_COLS);
  return res;
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

async function fetchRangeRows(supabase, table, columns, fromISO, toISO) {
  const page = 1000;
  const all = [];
  let start = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .range(start, start + page - 1);
    if (error) return { data: all, error };
    all.push(...(data || []));
    if (!data || data.length < page) return { data: all };
    start += page;
  }
}

function aggregateReport(subIdList, trafficRows, convRows) {
  const map = new Map();
  (subIdList || []).forEach((sub) => {
    if (sub) map.set(sub, { sub_id: sub, network_name: "Trafee", clicks: 0, conversions: 0, earning: 0 });
  });
  trafficRows.forEach((t) => {
    if (!t.sub_id) return;
    const cur = map.get(t.sub_id) || { sub_id: t.sub_id, network_name: "Trafee", clicks: 0, conversions: 0, earning: 0 };
    cur.clicks += 1;
    map.set(t.sub_id, cur);
  });
  convRows.forEach((c) => {
    if (!c.sub_id) return;
    const cur = map.get(c.sub_id) || { sub_id: c.sub_id, network_name: "Trafee", clicks: 0, conversions: 0, earning: 0 };
    cur.conversions += 1;
    cur.earning += Number(c.earning) || 0;
    map.set(c.sub_id, cur);
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

  const [reportRes, topTodayRes, topCountriesRes, totalEarnRes] = await Promise.all([
    Promise.all([
      fetchRangeRows(supabase, "traffic_logs", "sub_id", fromISO, toISO),
      fetchRangeRows(supabase, "conversions", "sub_id, earning", fromISO, toISO),
    ]),
    supabase
      .from("conversions")
      .select("sub_id, earning")
      .gte("created_at", todayISO),
    supabase
      .from("conversions")
      .select("country")
      .gte("created_at", todayISO),
    supabase.from("conversions").select("earning"),
  ]);

  const [reportTraffic, reportConvs] = reportRes;
  const report = aggregateReport(subIds, reportTraffic.data || [], reportConvs.data || []);

  const rangeConvs = (reportConvs.data || []).filter((c) => !subId || subId === "all" || c.sub_id === subId);

  const topMap = new Map();
  (topTodayRes.data || []).forEach((c) => {
    const cur = topMap.get(c.sub_id) || { sub_id: c.sub_id, conversions: 0, earning: 0 };
    cur.conversions += 1;
    cur.earning += Number(c.earning) || 0;
    topMap.set(c.sub_id, cur);
  });
  const topToday = [...topMap.values()]
    .map((v) => ({ ...v, earning: parseFloat(v.earning.toFixed(2)) }))
    .sort((a, b) => b.earning - a.earning)
    .slice(0, 10);

  const countryMap = new Map();
  (topCountriesRes.data || []).forEach((c) => {
    if (c.country) countryMap.set(c.country, (countryMap.get(c.country) || 0) + 1);
  });
  const topCountries = [...countryMap.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totals = {
    clicks: trafficCount.count || 0,
    conversions: convCount.count || 0,
    earning: parseFloat(rangeConvs.reduce((s, c) => s + (Number(c.earning) || 0), 0).toFixed(2)),
  };

  const allEarning = parseFloat(
    (totalEarnRes.data || []).reduce((s, c) => s + (Number(c.earning) || 0), 0).toFixed(2)
  );

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
    topToday,
    topCountries,
    subIds,
    redirectById,
  });
}
