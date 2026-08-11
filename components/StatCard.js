import { Icon } from "./icons";

const tones = {
  emerald: "text-emerald",
  sky: "text-sky-400",
  amber: "text-amber-400",
  red: "text-red-400",
  violet: "text-violet-400",
  muted: "text-muted",
};

export default function StatCard({ icon, label, value, sub, tone = "emerald", suffix }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg bg-emerald/10 border border-emerald/25 flex items-center justify-center ${tones[tone]}`}>
          <Icon name={icon} className="w-5 h-5" />
        </div>
        {suffix}
      </div>
      <div className="mt-4 text-2xl font-bold tabular-nums truncate">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
      {sub && <div className="mt-1 text-xs text-emerald">{sub}</div>}
    </div>
  );
}
