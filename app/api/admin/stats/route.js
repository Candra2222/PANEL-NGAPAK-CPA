import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dailyAggregate, groupBy } from "@/lib/aggregate";

const DAYS = 14;
const iso = (d) => d.toISOString().slice(0, 10);

export async function GET() {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();

  const start = new Date(Date.now() - (DAYS - 1) * 86400000);
  start.setHours(0, 0, 0, 0);
  const end = new Date(Date.now() + 86400000);
  end.setHours(0, 0, 0, 0);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const [
    panelsRes,
    redirectsRes,
    trafficTotalRes,
    convTotalRes,
    convByPanel,
    trafficDaily,
    convDaily,
    recentRes,
  ] = await Promise.all([
    supabase.from("panels").select("id, sub_id, panel_name, is_active, last_login_at"),
    supabase.from("redirects").select("panel_id, clicks"),
    supabase.from("traffic_logs").select("id", { count: "exact", head: true }),
    supabase.from("conversions").select("id", { count: "exact", head: true }),
    groupBy("conversions", "panel_id", "earning"),
    dailyAggregate("traffic_logs", null, startISO, endISO),
    dailyAggregate("conversions", "earning", startISO, endISO),
    supabase
      .from("conversions")
      .select("id, panel_id, network_name, country, earning, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (
    panelsRes.error ||
    redirectsRes.error ||
    trafficTotalRes.error ||
    convTotalRes.error ||
    recentRes.error
  ) {
    return error("Gagal memuat statistik.", 500);
  }

  const panels = panelsRes.data || [];
  const redirects = redirectsRes.data || [];

  const totalEarning = [...convByPanel.values()].reduce((s, v) => s + v.sum, 0);

  const linksByPanel = {};
  redirects.forEach((r) => {
    if (!r.panel_id) return;
    linksByPanel[r.panel_id] = linksByPanel[r.panel_id] || { links: 0, clicks: 0 };
    linksByPanel[r.panel_id].links += 1;
    linksByPanel[r.panel_id].clicks += r.clicks || 0;
  });

  const topPanels = panels
    .map((p) => ({
      panel_id: p.id,
      sub_id: p.sub_id,
      earning: parseFloat((convByPanel.get(p.id)?.sum || 0).toFixed(2)),
    }))
    .sort((a, b) => b.earning - a.earning)
    .slice(0, 8);

  const dayLabels = [];
  const convByDay = {};
  const earningByDay = {};
  const trafficByDay = {};
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    dayLabels.push(d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }));
  }
  trafficDaily.forEach((v, key) => {
    trafficByDay[key] = v.count;
  });
  convDaily.forEach((v, key) => {
    convByDay[key] = v.count;
    earningByDay[key] = v.sum;
  });

  const chart = dayLabels.map((label, i) => {
    const key = iso(new Date(start.getTime() + i * 86400000));
    return {
      day: label,
      traffic: trafficByDay[key] || 0,
      conversion: convByDay[key] || 0,
      earning: parseFloat((earningByDay[key] || 0).toFixed(2)),
    };
  });

  const panelsById = new Map(panels.map((p) => [p.id, p]));
  const panelList = panels.map((p) => ({
    id: p.id,
    sub_id: p.sub_id,
    panel_name: p.panel_name,
    is_active: p.is_active,
    last_login_at: p.last_login_at,
    links: linksByPanel[p.id]?.links || 0,
    clicks: linksByPanel[p.id]?.clicks || 0,
    conversions: convByPanel.get(p.id)?.count || 0,
    earning: parseFloat((convByPanel.get(p.id)?.sum || 0).toFixed(2)),
  }));

  const recent = (recentRes.data || []).map((c) => ({
    id: c.id,
    panel_id: c.panel_id,
    sub_id: panelsById.get(c.panel_id)?.sub_id || null,
    panel_name: panelsById.get(c.panel_id)?.panel_name || null,
    network_name: c.network_name,
    country: c.country,
    earning: Number(c.earning || 0),
    created_at: c.created_at,
  }));

  return json({
    totals: {
      panels: panels.length,
      activePanels: panels.filter((p) => p.is_active).length,
      links: redirects.length,
      traffic: trafficTotalRes.count || 0,
      conversions: convTotalRes.count || 0,
      earning: parseFloat(totalEarning.toFixed(2)),
    },
    chart,
    topPanels,
    panels: panelList,
    recent,
  });
}
