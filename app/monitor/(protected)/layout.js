"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { MonitorCtx } from "./monitor-context";
import { CountryFlag } from "@/components/BrandLogo";
import { isAuthed } from "@/lib/auth";
import { formatCurrency, formatNumber } from "@/lib/mock-data";
import { todayISO } from "@/lib/conversion-day";

const nav = [];

function PerformanceCard({ currency }) {
  const { overview } = useContext(MonitorCtx);
  const top = overview?.topToday || [];

  if (top.length === 0) {
    return (
      <div className="bg-surface-2 border border-line rounded-lg p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">Top Performance Hari Ini</div>
        <p className="text-xs text-muted">Belum ada conversion hari ini.</p>
      </div>
    );
  }

  const maxEarning = Math.max(...top.map((t) => t.earning), 1);

  return (
    <div className="bg-surface-2 border border-line rounded-lg p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">Top Performance Hari Ini</div>
      <div className="space-y-1.5">
        {top.map((t) => (
          <div key={t.sub_id} className="flex items-center gap-2">
            <span className="w-[66px] font-mono text-[10px] text-emerald truncate" title={t.sub_id}>{t.sub_id}</span>
            <span className="w-6 shrink-0 text-right text-[10px] font-semibold text-muted tabular-nums" title={`${t.conversions} conversion`}>
              x{t.conversions}
            </span>
            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-emerald rounded-full" style={{ width: `${(t.earning / maxEarning) * 100}%` }} />
            </div>
            <span className="w-[62px] text-right text-[10px] font-semibold tabular-nums text-muted">
              {formatCurrency(t.earning, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountryCard() {
  const { overview } = useContext(MonitorCtx);
  const countries = overview?.topCountries || [];
  const maxCountry = Math.max(...countries.map((c) => c.count), 1);

  if (countries.length === 0) {
    return (
      <div className="bg-surface-2 border border-line rounded-lg p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">Top Country</div>
        <p className="text-xs text-muted">Belum ada data.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-line rounded-lg p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">Top Country</div>
      <div className="space-y-1.5">
        {countries.map((d) => (
          <div key={d.country} className="flex items-center gap-2">
            <span className="w-6 shrink-0 flex justify-center"><CountryFlag country={d.country} size={16} /></span>
            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-emerald rounded-full" style={{ width: `${(d.count / maxCountry) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-[10px] font-semibold tabular-nums">{formatNumber(d.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarWidgets({ currency }) {
  const { view, setView } = useContext(MonitorCtx);

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-line overflow-hidden">
        <button
          onClick={() => setView("realtime")}
          className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${
            view === "realtime" ? "bg-emerald text-navy" : "bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          Realtime Monitor
        </button>
        <button
          onClick={() => setView("report")}
          className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${
            view === "report" ? "bg-emerald text-navy" : "bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          Report
        </button>
      </div>

      <PerformanceCard currency={currency} />
      <CountryCard />
    </div>
  );
}

export default function MonitorLayout({ children }) {
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");
  const [view, setView] = useState("realtime");
  const [overview, setOverview] = useState(null);
  const [range, setRange] = useState("today");
  const [reportFrom, setReportFrom] = useState(todayISO());
  const [reportTo, setReportTo] = useState(todayISO());

  const overviewParams = useCallback(() => {
    const params = new URLSearchParams();
    if (view === "report") {
      params.set("range", "custom");
      params.set("from", reportFrom);
      params.set("to", reportTo);
    } else {
      params.set("range", range);
    }
    return params;
  }, [view, range, reportFrom, reportTo]);

  const refreshOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/monitor/stats?${overviewParams()}`);
      if (!res.ok) return;
      const data = await res.json();
      setOverview(data);
    } catch {}
  }, [overviewParams]);

  useEffect(() => {
    if (!isAuthed("monitor")) {
      router.replace("/monitor/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/monitor/stats?${overviewParams()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOverview(data);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [router, overviewParams]);

  const totalEarning = overview?.totals?.earning ?? 0;

  return (
    <MonitorCtx.Provider value={{ currency, setCurrency, view, setView, overview, refreshOverview, range, setRange, reportFrom, setReportFrom, reportTo, setReportTo }}>
      <Shell
        brand="CPA Link Panel"
        sub="Realtime Monitor"
        panelKey="monitor"
        user={{ name: "Monitor", initials: "MN" }}
        nav={nav}
        sidebar={<SidebarWidgets currency={currency} />}
        showClock
        headerTitle="Realtime Monitor"
        headerStat={{ label: "Total Earning", value: formatCurrency(totalEarning, currency) }}
      >
        {children}
      </Shell>
    </MonitorCtx.Provider>
  );
}
