"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContext } from "react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";
import { MonitorCtx } from "../monitor-context";
import { DeviceLogo, BrowserLogo, AppLogo, CountryFlag } from "@/components/BrandLogo";
import { FaCrown } from "react-icons/fa";
import { playLeadSound } from "@/lib/sound";
import { formatNumber, formatCurrency, dateTime } from "@/lib/mock-data";
import { todayISO, startOfConversionDay } from "@/lib/conversion-day";

const shiftISO = (dateStr, days) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const formatDate = (dateStr) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatRange = (from, to) => {
  if (from === to) return formatDate(from);
  const a = new Date(from + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  const b = new Date(to + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `${a} – ${b}`;
};

const crOf = (conversions, clicks) => (clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : "0.0");

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const rangeCutoff = (range) => {
  switch (range) {
    case "today":
      return startOfConversionDay();
    case "yesterday":
      return startOfConversionDay() - 24 * 3600 * 1000;
    case "week":
      return Date.now() - 7 * 86400 * 1000;
    case "month":
      return Date.now() - 30 * 86400 * 1000;
    default:
      return Date.now() - 24 * 3600 * 1000;
  }
};

export default function MonitorDashboard() {
  const { view } = useContext(MonitorCtx);
  return view === "report" ? <ReportView /> : <RealtimeView />;
}

function ReportView() {
  const { currency, reportFrom: from, setReportFrom: setFrom, reportTo: to, setReportTo: setTo } = useContext(MonitorCtx);
  const [range, setRange] = useState("today");
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ range: "custom", from, to });
    fetch(`/api/monitor/stats?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setData(d.report || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const applyRange = (key) => {
    if (key === "custom") return;
    const today = todayISO();
    if (key === "today") {
      setFrom(today);
      setTo(today);
    } else if (key === "yesterday") {
      setFrom(shiftISO(today, -1));
      setTo(shiftISO(today, -1));
    } else if (key === "week") {
      setFrom(shiftISO(today, -6));
      setTo(today);
    } else if (key === "month") {
      setFrom(shiftISO(today, -29));
      setTo(today);
    }
    setRange(key);
  };

  const total = (data || []).reduce(
    (s, r) => ({ clicks: s.clicks + r.clicks, conversions: s.conversions + r.conversions, earning: s.earning + r.earning }),
    { clicks: 0, conversions: 0, earning: 0 }
  );

  const invalidRange = from > to;

  return (
    <div>
      <PageHeader
        title="Report"
        desc="Untuk cek hasil keseluruhan tim"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={range} onChange={applyRange}>
              {RANGES.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
              <option value="custom">Custom</option>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">Dari</span>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value || todayISO()); setRange("custom"); }}
                className="bg-navy border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">Sampai</span>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value || todayISO()); setRange("custom"); }}
                className="bg-navy border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20"
              />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="chart" label="Total Click" value={formatNumber(total.clicks)} sub={formatRange(from, to)} tone="violet" />
        <StatCard icon="bolt" label="Conversion" value={formatNumber(total.conversions)} sub={`CR ${crOf(total.conversions, total.clicks)}%`} tone="emerald" />
        <StatCard icon="wallet" label="Payout" value={formatCurrency(total.earning, currency)} sub={`≈ ${formatCurrency(total.earning, currency === "USD" ? "IDR" : "USD")}`} tone="amber" />
        <StatCard icon="users" label="Sub ID" value={formatNumber((data || []).length)} sub="All Sub ID" tone="sky" />
      </div>

      <section className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">Report per Sub ID</h2>
            <p className="text-xs text-muted mt-0.5">{formatRange(from, to)}</p>
          </div>
          <Badge tone="green" dot>All Sub ID</Badge>
        </div>
        {invalidRange ? (
          <p className="text-sm text-red-400 px-5 py-10 text-center">
            Tanggal &quot;Dari&quot; tidak boleh lebih besar dari tanggal &quot;Sampai&quot;.
          </p>
        ) : data === null ? (
          <p className="text-sm text-muted px-5 py-10 text-center">Memuat laporan...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted px-5 py-10 text-center">Belum ada data pada rentang tanggal ini.</p>
        ) : (
          <ReportTable data={data} currency={currency} />
        )}
      </section>
    </div>
  );
}

function ReportTable({ data, currency }) {
  const total = data.reduce(
    (s, r) => ({ clicks: s.clicks + r.clicks, conversions: s.conversions + r.conversions, earning: s.earning + r.earning }),
    { clicks: 0, conversions: 0, earning: 0 }
  );
  return (
    <div className="cpa-table-wrap">
      <table className="w-full text-sm cpa-table">
        <thead>
          <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
            <th className="px-5 py-3 font-semibold">No</th>
            <th className="px-5 py-3 font-semibold">Sub ID</th>
            <th className="px-5 py-3 font-semibold">Network</th>
            <th className="px-5 py-3 font-semibold text-right">Click</th>
            <th className="px-5 py-3 font-semibold text-right">Conversion</th>
            <th className="px-5 py-3 font-semibold text-right">CR</th>
            <th className="px-5 py-3 font-semibold text-right">Payout</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.sub_id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
              <td className="px-5 py-3 text-muted tabular-nums">{i + 1}</td>
              <td className="px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-emerald">{r.sub_id}</span>
                  {i === 0 && r.earning > 0 && <FaCrown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Earning tertinggi" />}
                </span>
              </td>
              <td className="px-5 py-3 text-muted text-xs">{r.network_name}</td>
              <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.clicks)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.conversions)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{crOf(r.conversions, r.clicks)}%</td>
              <td className="px-5 py-3 text-right font-semibold text-emerald">{formatCurrency(r.earning, currency)}</td>
            </tr>
          ))}
          <tr className="bg-emerald/5 border-t border-line">
            <td className="px-5 py-3 font-bold" colSpan={3}>Total All Sub ID</td>
            <td className="px-5 py-3 text-right font-bold tabular-nums">{formatNumber(total.clicks)}</td>
            <td className="px-5 py-3 text-right font-bold tabular-nums">{formatNumber(total.conversions)}</td>
            <td className="px-5 py-3 text-right font-bold tabular-nums">{crOf(total.conversions, total.clicks)}%</td>
            <td className="px-5 py-3 text-right font-bold text-emerald">{formatCurrency(total.earning, currency)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RealtimeView() {
  const { currency, setCurrency, refreshOverview, range, setRange } = useContext(MonitorCtx);
  const [filterSubId, setFilterSubId] = useState("all");
  const [soundOn, setSoundOn] = useState(true);
  const [tab, setTab] = useState("realtime");

  const [base, setBase] = useState({
    feed: [],
    conversions: [],
    totals: { clicks: 0, conversions: 0, earning: 0 },
    subIds: [],
    redirectById: {},
  });
  const [liveTraffic, setLiveTraffic] = useState([]);
  const [liveConvs, setLiveConvs] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [ready, setReady] = useState(false);
  const feedRef = useRef(null);
  const seenIds = useRef(new Set());
  const newestRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ range });
    if (filterSubId !== "all") params.set("sub_id", filterSubId);
    fetch(`/api/monitor/stats?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const feed = d.feed || [];
        const conversions = d.conversions || [];
        const baseIds = new Set([...feed, ...conversions].map((x) => x.id));
        seenIds.current = new Set([...seenIds.current, ...baseIds]);
        const newestBase = [...feed, ...conversions].reduce((max, x) => {
          const ts = new Date(x.created_at).getTime();
          return !isNaN(ts) && ts > max ? ts : max;
        }, newestRef.current || 0);
        newestRef.current = newestBase || null;
        setBase({
          feed,
          conversions,
          totals: d.totals || { clicks: 0, conversions: 0, earning: 0 },
          subIds: d.subIds || [],
          redirectById: d.redirectById || {},
        });
        setLiveTraffic((prev) => prev.filter((t) => !baseIds.has(t.id)));
        setLiveConvs((prev) => prev.filter((c) => !baseIds.has(c.id)));
        setFlashId(null);
        setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [range, filterSubId]);

  const handleLive = useCallback(
    (ev, type, notify = true) => {
      if (!ev || !ev.id) return;
      if (!ready) return;
      if (seenIds.current.has(ev.id)) return;
      seenIds.current.add(ev.id);
      const ts = new Date(ev.created_at).getTime();
      if (!isNaN(ts) && (!newestRef.current || ts > newestRef.current)) {
        newestRef.current = ts;
      }
      if (type === "traffic") {
        setLiveTraffic((prev) => [ev, ...prev].slice(0, 120));
        setLastEvent({ ...ev, type: "traffic" });
        setFlashId(ev.id);
      } else {
        setLiveConvs((prev) => [ev, ...prev].slice(0, 120));
        setLastEvent({ ...ev, type: "conversion" });
        setFlashId(ev.id);
        refreshOverview();
        if (!notify) return;
        if (soundOn) playLeadSound();
        pushToast({
          title: "Lead Baru!",
          body: (
            <>
              {ev.sub_id} — {formatCurrency(ev.earning, currency)} dari{" "}
              <CountryFlag country={ev.country} size={14} />
            </>
          ),
          tone: "emerald",
        });
      }
    },
    [ready, soundOn, currency, refreshOverview]
  );

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    let es;
    try {
      es = new EventSource("/api/monitor/stream");
    } catch {
      return;
    }

    const onTraffic = (e) => {
      try {
        handleLive(JSON.parse(e.data), "traffic");
      } catch {}
    };
    const onConversion = (e) => {
      try {
        handleLive(JSON.parse(e.data), "conversion");
      } catch {}
    };

    es.addEventListener("traffic", onTraffic);
    es.addEventListener("conversion", onConversion);
    return () => {
      es.close();
    };
  }, [handleLive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ready) return;
    let stopped = false;
    const poll = async () => {
      if (stopped || document.hidden) return;
      try {
        const params = new URLSearchParams({ range });
        if (filterSubId !== "all") params.set("sub_id", filterSubId);
        const hasSince = !!newestRef.current;
        if (newestRef.current) params.set("since", new Date(newestRef.current).toISOString());
        const res = await fetch(`/api/monitor/live?${params}`);
        if (!res.ok) return;
        const d = await res.json();
        (d.traffic || []).forEach((t) => handleLive(t, "traffic", false));
        (d.conversions || []).forEach((c) => handleLive(c, "conversion", hasSince));
      } catch {}
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [handleLive, ready, range, filterSubId]);

  useEffect(() => {
    if (feedRef.current && lastEvent) {
      feedRef.current.scrollTop = 0;
    }
  }, [lastEvent, liveTraffic.length]);

  const allTraffic = useMemo(() => [...liveTraffic, ...base.feed], [liveTraffic, base.feed]);
  const allConvs = useMemo(() => [...liveConvs, ...base.conversions], [liveConvs, base.conversions]);

  const filteredTraffic = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const upper = range === "yesterday" ? startOfConversionDay() : Infinity;
    return allTraffic
      .filter((t) => (filterSubId === "all" ? true : t.sub_id === filterSubId))
      .filter((t) => {
        const ts = new Date(t.created_at).getTime();
        return ts >= cutoff && ts < upper;
      })
      .slice(0, 60);
  }, [allTraffic, range, filterSubId]);

  const filteredConvs = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const upper = range === "yesterday" ? startOfConversionDay() : Infinity;
    return allConvs
      .filter((c) => (filterSubId === "all" ? true : c.sub_id === filterSubId))
      .filter((c) => {
        const ts = new Date(c.created_at).getTime();
        return ts >= cutoff && ts < upper;
      });
  }, [allConvs, range, filterSubId]);

  const liveCount = liveTraffic.length + liveConvs.length;

  const liveInRange = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const upper = range === "yesterday" ? startOfConversionDay() : Infinity;
    const bySub = (x) => (filterSubId === "all" ? true : x.sub_id === filterSubId);
    const inRange = (x) => {
      const ts = new Date(x.created_at).getTime();
      return ts >= cutoff && ts < upper;
    };
    return {
      clicks: liveTraffic.filter(bySub).filter(inRange).length,
      conversions: liveConvs.filter(bySub).filter(inRange),
    };
  }, [liveTraffic, liveConvs, range, filterSubId]);

  const liveEarning = liveInRange.conversions.reduce((s, c) => s + (Number(c.earning) || 0), 0);
  const totalClicks = base.totals.clicks + liveInRange.clicks;
  const totalConversions = base.totals.conversions + liveInRange.conversions.length;
  const totalEarning = base.totals.earning + liveEarning;

  const feed = useMemo(() => {
    return [...filteredTraffic]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 40);
  }, [filteredTraffic]);

  const topEarningSubId = useMemo(() => {
    const map = new Map();
    filteredConvs.forEach((c) => map.set(c.sub_id, (map.get(c.sub_id) || 0) + c.earning));
    let top = null;
    for (const [sub, total] of map) {
      if (top === null || total > top.total) top = { sub, total };
    }
    return top ? top.sub : null;
  }, [filteredConvs]);

  const ctr = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00";
  const { subIds } = base;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald">
          <span className="w-2 h-2 rounded-full bg-emerald animate-pulse-dot" />
          LIVE
          <span className="font-normal text-muted text-xs">(+{formatNumber(liveCount)} event baru sesi ini)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterSubId} onChange={(v) => { setFilterSubId(v); setReady(false); }}>
            <option value="all">All Sub ID</option>
            {subIds.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={range} onChange={(v) => { setRange(v); setReady(false); }}>
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </Select>
          <div className="flex rounded-lg border border-line overflow-hidden">
            {["USD", "IDR"].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-2 text-xs font-bold transition-colors ${currency === c ? "bg-emerald text-navy" : "bg-surface text-muted hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSoundOn(!soundOn)}
            title={soundOn ? "Suara aktif" : "Suara nonaktif"}
            className={`p-2 rounded-lg border transition-colors ${soundOn ? "border-emerald/40 text-emerald bg-emerald/10" : "border-line text-muted"}`}
          >
            <Icon name="bell" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="chart" label="Total Click" value={formatNumber(totalClicks)} sub="All Click" tone="violet" />
        <StatCard icon="bolt" label="Conversion" value={formatNumber(totalConversions)} sub={`CTR ${ctr}%`} tone="emerald" />
        <StatCard icon="wallet" label="Earning" value={formatCurrency(totalEarning, currency)} sub={`≈ ${formatCurrency(totalEarning, currency === "USD" ? "IDR" : "USD")}`} tone="amber" />
        <StatCard icon="monitor" label="Sub ID" value={filterSubId === "all" ? "All Sub ID" : filterSubId} sub={subIds.length + " Sub ID"} tone="sky" />
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="flex border-b border-line">
          <button
            onClick={() => setTab("realtime")}
            className={`flex-1 py-3 px-5 text-sm font-bold transition-colors ${tab === "realtime" ? "text-emerald bg-surface-2 border-b-2 border-emerald" : "text-muted hover:text-foreground"}`}
          >
            Live Traffic Feed <span className="ml-1 text-xs font-normal text-muted">({formatNumber(feed.length)})</span>
          </button>
          <button
            onClick={() => setTab("reports")}
            className={`flex-1 py-3 px-5 text-sm font-bold transition-colors ${tab === "reports" ? "text-emerald bg-surface-2 border-b-2 border-emerald" : "text-muted hover:text-foreground"}`}
          >
            Conversion <span className="ml-1 text-xs font-normal text-muted">({formatNumber(filteredConvs.length)})</span>
          </button>
        </div>

        <div className="cpa-table-wrap" ref={feedRef}>
          {tab === "realtime" ? (
            <table className="w-full text-sm cpa-table">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">No</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">Sub ID</th>
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-5 py-3 font-semibold">Device</th>
                  <th className="px-5 py-3 font-semibold">App</th>
                  <th className="px-5 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((e, i) => (
                  <tr key={e.id} className={`border-b border-line/50 last:border-0 hover:bg-surface-2/50${e.id === flashId ? " animate-row-flash" : ""}`}>
                    <td className="px-5 py-3 text-muted tabular-nums text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      {e.region || e.city ? (
                        <div>
                          <div className="text-xs text-sky-400 font-semibold">{e.region || e.city}</div>
                          {e.region && e.city && <div className="text-[11px] text-muted">{e.city}</div>}
                          {e.postal_code && <div className="text-[11px] text-muted tabular-nums">{e.postal_code}</div>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-emerald">{e.sub_id}</td>
                    <td className="px-5 py-3"><CountryFlag country={e.country} size={18} /></td>
                    <td className="px-5 py-3"><DeviceCell device={e.os_device} /></td>
                    <td className="px-5 py-3"><AppCell app={e.app} browser={e.browser_app} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{e.ip_address || "-"}</td>
                  </tr>
                ))}
                {feed.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted">Belum ada data untuk filter ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm cpa-table">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">No</th>
                  <th className="px-5 py-3 font-semibold">Sub ID</th>
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-5 py-3 font-semibold">Network</th>
                  <th className="px-5 py-3 font-semibold">Device</th>
                  <th className="px-5 py-3 font-semibold">App</th>
                  <th className="pl-5 pr-14 py-3 font-semibold text-right">Earning</th>
                  <th className="px-5 py-3 font-semibold">IP</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredConvs.map((c, i) => (
                  <tr key={c.id} className={`border-b border-line/50 last:border-0 hover:bg-emerald/5${c.id === flashId ? " animate-row-flash" : ""}`}>
                    <td className="px-5 py-3 text-muted tabular-nums text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-emerald">{c.sub_id}</span>
                        {topEarningSubId === c.sub_id && (
                          <FaCrown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Earning tertinggi" />
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3"><CountryFlag country={c.country} size={18} /></td>
                    <td className="px-5 py-3 text-muted text-xs">{c.network_name}</td>
                    <td className="px-5 py-3"><DeviceCell device={c.os_device} /></td>
                    <td className="px-5 py-3"><AppCell app={c.app} browser={c.browser_app} /></td>
                    <td className="pl-5 pr-14 py-3 text-right font-semibold text-emerald whitespace-nowrap tabular-nums">{formatCurrency(c.earning, currency)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{c.ip_address || "-"}</td>
                    <td className="px-5 py-3 text-xs text-muted whitespace-nowrap tabular-nums">{dateTime(c.created_at)}</td>
                  </tr>
                ))}
                {filteredConvs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted">Belum ada conversion untuk filter ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceCell({ device }) {
  return (
    <span className="flex items-center gap-1.5">
      <DeviceLogo device={device} size={16} />
    </span>
  );
}

function AppCell({ app, browser }) {
  return (
    <span className="flex items-center gap-1.5">
      {app ? <AppLogo app={app} size={16} /> : <BrowserLogo browser={browser} size={16} />}
    </span>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface border border-line rounded-lg px-3 py-2 text-xs font-semibold text-muted focus:outline-none focus:border-emerald/60 hover:text-foreground"
    >
      {children}
    </select>
  );
}
