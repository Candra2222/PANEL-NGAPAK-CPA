"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useContext } from "react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";
import { MonitorCtx } from "../monitor-context";
import { DeviceLogo, AppLogo, CountryFlag } from "@/components/BrandLogo";
import { FaCrown } from "react-icons/fa";
import { playLeadSound } from "@/lib/sound";
import {
  mockTraffic,
  mockConversions,
  mockRedirects,
  mockApps,
  dailyReportRange,
  startOfConversionDay,
  formatNumber,
  formatCurrency,
} from "@/lib/mock-data";

const todayISO = () => new Date().toISOString().slice(0, 10);

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

const COUNTRIES = ["ID", "MY", "SG", "TH", "PH", "VN", "US", "GB", "SA", "AU"];
const BROWSERS = ["Chrome", "Safari", "Edge", "Firefox", "Opera", "Samsung Internet"];
const DEVICES = ["Android", "iPhone", "Desktop Windows", "macOS", "iPad", "Desktop Linux"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randIp() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export default function MonitorDashboard() {
  const { view } = useContext(MonitorCtx);
  return view === "report" ? <ReportView /> : <RealtimeView />;
}

function ReportView() {
  const { currency } = useContext(MonitorCtx);
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [range, setRange] = useState("today");
  const data = useMemo(() => dailyReportRange(from, to), [from, to]);

  const applyRange = (key) => {
    if (key === "custom") return;
    const fmt = (d) => d.toISOString().slice(0, 10);
    const now = new Date();
    const a = new Date(now);
    if (key === "today") {
      setFrom(todayISO());
      setTo(todayISO());
    } else if (key === "yesterday") {
      a.setDate(a.getDate() - 1);
      setFrom(fmt(a));
      setTo(fmt(a));
    } else if (key === "week") {
      a.setDate(a.getDate() - 6);
      setFrom(fmt(a));
      setTo(todayISO());
    } else if (key === "month") {
      a.setDate(a.getDate() - 29);
      setFrom(fmt(a));
      setTo(todayISO());
    }
    setRange(key);
  };

  const total = data.reduce(
    (s, r) => ({ clicks: s.clicks + r.clicks, conversions: s.conversions + r.conversions, earning: s.earning + r.earning }),
    { clicks: 0, conversions: 0, earning: 0 }
  );

  const invalidRange = from > to;

  return (
    <div>
      <PageHeader
        title="Report"
        desc="UNTUK CEK HASIL KESELURUHAN TIM"
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

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="chart" label="Total Click" value={formatNumber(total.clicks)} sub={formatRange(from, to)} tone="violet" />
        <StatCard icon="bolt" label="Conversion" value={formatNumber(total.conversions)} sub={`CR ${crOf(total.conversions, total.clicks)}%`} tone="emerald" />
        <StatCard icon="wallet" label="Payout" value={formatCurrency(total.earning, currency)} sub={`≈ ${formatCurrency(total.earning, currency === "USD" ? "IDR" : "USD")}`} tone="amber" />
        <StatCard icon="users" label="Sub ID" value={formatNumber(data.length)} sub="All Sub ID" tone="sky" />
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
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
                  {i === 0 && <FaCrown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Earning tertinggi" />}
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
  const { currency, setCurrency } = useContext(MonitorCtx);
  const [range, setRange] = useState("today");
  const [filterSubId, setFilterSubId] = useState("all");
  const [soundOn, setSoundOn] = useState(true);
  const [tab, setTab] = useState("realtime");

  const [traffic, setTraffic] = useState(mockTraffic);
  const [conversions, setConversions] = useState(mockConversions);
  const [liveCount, setLiveCount] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  const feedRef = useRef(null);

  const subIds = useMemo(
    () => [...new Set(mockRedirects.map((r) => r.sub_id))],
    []
  );

  const redirectById = useMemo(() => {
    const m = new Map();
    mockRedirects.forEach((r) => m.set(r.id, r));
    return m;
  }, []);

  useEffect(() => {
    const tick = () => {
      const isConv = Math.random() < 0.28;
      if (isConv) {
        const r = rand(mockRedirects);
        const amount = parseFloat((Math.random() * 6 + 0.5).toFixed(2));
        const conv = {
          id: "live" + Date.now() + Math.random().toString(36).slice(2, 6),
          redirect_id: r.id,
          panel_id: r.panel_id,
          sub_id: r.sub_id,
          network_name: "Trafee",
          country: rand(COUNTRIES),
          earning: amount,
          ip_address: randIp(),
          browser_app: rand(BROWSERS),
          os_device: rand(DEVICES),
          app: rand(mockApps),
          created_at: new Date().toISOString(),
        };
        setConversions((prev) => [conv, ...prev]);
        setLastEvent({ ...conv, type: "conversion" });
        setLiveCount((c) => c + 1);
        if (soundOn) playLeadSound();
        pushToast({
          title: "Lead Baru!",
          body: (
            <>
              {conv.sub_id} — {formatCurrency(conv.earning, currency)} dari{" "}
              <CountryFlag country={conv.country} size={14} />
            </>
          ),
          tone: "emerald",
        });
      } else {
        const r = rand(mockRedirects);
        const t = {
          id: "live" + Date.now() + Math.random().toString(36).slice(2, 6),
          redirect_id: r.id,
          panel_id: r.panel_id,
          sub_id: r.sub_id,
          ip_address: randIp(),
          country: rand(COUNTRIES),
          browser_app: rand(BROWSERS),
          os_device: rand(DEVICES),
          app: rand(mockApps),
          created_at: new Date().toISOString(),
        };
        setTraffic((prev) => [t, ...prev]);
        setLastEvent({ ...t, type: "traffic" });
        setLiveCount((c) => c + 1);
      }
    };

    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [soundOn, currency]);

  useEffect(() => {
    if (feedRef.current && lastEvent) {
      feedRef.current.scrollTop = 0;
    }
  }, [lastEvent, traffic.length]);

  const filteredTraffic = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const upper = range === "yesterday" ? startOfConversionDay() : Infinity;
    return traffic
      .filter((t) => (filterSubId === "all" ? true : t.sub_id === filterSubId))
      .filter((t) => {
        const ts = new Date(t.created_at).getTime();
        return ts >= cutoff && ts < upper;
      })
      .slice(0, 60);
  }, [traffic, range, filterSubId]);

  const filteredConvs = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const upper = range === "yesterday" ? startOfConversionDay() : Infinity;
    return conversions
      .filter((c) => (filterSubId === "all" ? true : c.sub_id === filterSubId))
      .filter((c) => {
        const ts = new Date(c.created_at).getTime();
        return ts >= cutoff && ts < upper;
      })
      .slice(0, 60);
  }, [conversions, range, filterSubId]);

  const totalClicks = useMemo(
    () =>
      (filterSubId === "all" ? mockRedirects : mockRedirects.filter((r) => r.sub_id === filterSubId)).reduce(
        (s, r) => s + r.clicks,
        0
      ) + liveCount,
    [filterSubId, liveCount]
  );

  const totalConversions = filteredConvs.length;
  const totalEarning = useMemo(
    () => filteredConvs.reduce((s, c) => s + c.earning, 0),
    [filteredConvs]
  );

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

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald">
          <span className="w-2 h-2 rounded-full bg-emerald animate-pulse-dot" />
          LIVE
          <span className="font-normal text-muted text-xs">(+{formatNumber(liveCount)} event baru sesi ini)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterSubId} onChange={setFilterSubId}>
            <option value="all">All Sub ID</option>
            {subIds.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={range} onChange={setRange}>
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

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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

        <div className="overflow-x-auto max-h-[560px] overflow-y-auto" ref={feedRef}>
          {tab === "realtime" ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">No</th>
                  <th className="px-5 py-3 font-semibold">Referrer</th>
                  <th className="px-5 py-3 font-semibold">Sub ID</th>
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-5 py-3 font-semibold">Device</th>
                  <th className="px-5 py-3 font-semibold">App</th>
                  <th className="px-5 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((e, i) => (
                  <tr key={e.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3 text-muted tabular-nums text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      <span
                        className="font-mono text-[11px] text-sky truncate max-w-[220px] inline-block align-middle"
                        title={redirectById.get(e.redirect_id)?.destination_url || ""}
                      >
                        {redirectById.get(e.redirect_id)?.destination_url ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-emerald">{e.sub_id}</td>
                    <td className="px-5 py-3"><CountryFlag country={e.country} size={18} /></td>
                    <td className="px-5 py-3"><DeviceLogo device={e.os_device} size={18} /></td>
                    <td className="px-5 py-3"><AppLogo app={e.app} size={18} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{e.ip_address}</td>
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
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">No</th>
                  <th className="px-5 py-3 font-semibold">Sub ID</th>
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-5 py-3 font-semibold">Network</th>
                  <th className="px-5 py-3 font-semibold">Device</th>
                  <th className="px-5 py-3 font-semibold">App</th>
                  <th className="px-5 py-3 font-semibold text-right">Earning</th>
                  <th className="px-5 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredConvs.slice(0, 10).map((c, i) => (
                  <tr key={c.id} className="border-b border-line/50 last:border-0 hover:bg-emerald/5">
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
                    <td className="px-5 py-3"><DeviceLogo device={c.os_device} size={18} /></td>
                    <td className="px-5 py-3"><AppLogo app={c.app} size={18} /></td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald">{formatCurrency(c.earning, currency)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{c.ip_address}</td>
                  </tr>
                ))}
                {filteredConvs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted">Belum ada conversion untuk filter ini.</td>
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
