import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DAYS = 14;
const iso = (d) => d.toISOString().slice(0, 10);

export async function GET() {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();

  const [panelsRes, redirectsRes, trafficRes, convsRes, recentRes] = await Promise.all([
    supabase.from("panels").select("id, sub_id, panel_name, is_active, last_login_at"),
    supabase.from("redirects").select("panel_id, clicks"),
    supabase.from("traffic_logs").select("created_at"),
    supabase.from("conversions").select("panel_id, earning, created_at"),
    supabase
      .from("conversions")
      .select("panel_id, network_name, country, earning, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (panelsRes.error || redirectsRes.error || trafficRes.error || convsRes.error || recentRes.error) {
    return error("Gagal memuat statistik.", 500);
  }

  const panels = panelsRes.data || [];
  const redirects = redirectsRes.data || [];
  const conversions = convsRes.data || [];
  const panelsById = new Map(panels.map((p) => [p.id, p]));

  const totalEarning = conversions.reduce((s, c) => s + Number(c.earning || 0), 0);

  const linksByPanel = {};
  redirects.forEach((r) => {
    if (!r.panel_id) return;
    linksByPanel[r.panel_id] = linksByPanel[r.panel_id] || { links: 0, clicks: 0 };
    linksByPanel[r.panel_id].links += 1;
    linksByPanel[r.panel_id].clicks += r.clicks || 0;
  });

  const earningByPanel = {};
  conversions.forEach((c) => {
    if (!c.panel_id) return;
    earningByPanel[c.panel_id] = (earningByPanel[c.panel_id] || 0) + Number(c.earning || 0);
  });

  const topPanels = panels
    .map((p) => ({
      panel_id: p.id,
      sub_id: p.sub_id,
      earning: parseFloat((earningByPanel[p.id] || 0).toFixed(2)),
    }))
    .sort((a, b) => b.earning - a.earning)
    .slice(0, 8);

  const dayLabels = [];
  const convByDay = {};
  const earningByDay = {};
  const trafficByDay = {};
  const start = new Date(Date.now() - (DAYS - 1) * 86400000);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < DAYS; i++) {
    const key = iso(new Date(start.getTime() + i * 86400000));
    dayLabels.push(new Date(start.getTime() + i * 86400000).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }));
    convByDay[key] = 0;
    earningByDay[key] = 0;
    trafficByDay[key] = 0;
  }
  conversions.forEach((c) => {
    const key = iso(new Date(c.created_at));
    if (key in convByDay) {
      convByDay[key] += 1;
      earningByDay[key] += Number(c.earning || 0);
    }
  });
  (trafficRes.data || []).forEach((t) => {
    const key = iso(new Date(t.created_at));
    if (key in trafficByDay) trafficByDay[key] += 1;
  });

  const chart = dayLabels.map((label, i) => {
    const key = iso(new Date(start.getTime() + i * 86400000));
    return {
      day: label,
      traffic: trafficByDay[key],
      conversion: convByDay[key],
      earning: parseFloat(earningByDay[key].toFixed(2)),
    };
  });

  const panelList = panels.map((p) => ({
    id: p.id,
    sub_id: p.sub_id,
    panel_name: p.panel_name,
    is_active: p.is_active,
    last_login_at: p.last_login_at,
    links: linksByPanel[p.id]?.links || 0,
    clicks: linksByPanel[p.id]?.clicks || 0,
    earning: parseFloat((earningByPanel[p.id] || 0).toFixed(2)),
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
      traffic: (trafficRes.data || []).length,
      conversions: conversions.length,
      earning: parseFloat(totalEarning.toFixed(2)),
    },
    chart,
    topPanels,
    panels: panelList,
    recent,
  });
}
