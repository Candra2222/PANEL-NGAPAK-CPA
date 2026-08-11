"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/mock-data";

function ChartTooltip({ active, payload, label, currency, money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-lg px-3 py-2 text-xs shadow-xl shadow-black/40">
      <div className="font-bold text-muted mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted capitalize">{p.dataKey}:</span>
          <span className="font-semibold">
            {money ? formatCurrency(p.value, currency) : p.value.toLocaleString("id-ID")}
          </span>
        </div>
      ))}
    </div>
  );
}

const AXIS = { fontSize: 11, fill: "#8b949e", stroke: "transparent", tickLine: false, axisLine: false };
const GRID = { stroke: "#30363d", strokeDasharray: "3 3", vertical: false };

export function EarningsChart({ data, currency = "USD" }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="day" {...AXIS} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...AXIS} />
        <Tooltip content={<ChartTooltip currency={currency} money />} />
        <defs>
          <linearGradient id="gEarning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="earning" name="Earning" stroke="#10b981" fill="url(#gEarning)" strokeWidth={2} />
        <Area type="monotone" dataKey="conversion" name="Conversion" stroke="#38bdf8" fill="url(#gConv)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrafficChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="jam" {...AXIS} minTickGap={32} />
        <YAxis {...AXIS} />
        <Tooltip content={<ChartTooltip />} />
        <defs>
          <linearGradient id="gTraffic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="traffic" name="Traffic" stroke="#10b981" fill="url(#gTraffic)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopBarChart({ data, money, currency = "USD", dataKey = "earning", color = "#10b981" }) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis type="number" {...AXIS} tickFormatter={(v) => (money ? formatCurrency(v, currency) : v)} />
        <YAxis type="category" dataKey="sub_id" width={92} {...AXIS} />
        <Tooltip content={<ChartTooltip currency={currency} money={money} />} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey={dataKey} radius={[4, 4, 4, 4]} fill={color} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={i === 0 ? color : `${color}88`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CountryChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.country} className="flex items-center gap-3">
          <span className="w-10 text-xs font-mono text-muted">{d.country}</span>
          <div className="flex-1 h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald to-emerald/60 rounded-full"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-semibold tabular-nums">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
