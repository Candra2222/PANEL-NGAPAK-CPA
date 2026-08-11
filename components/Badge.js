const tones = {
  green: "bg-emerald/15 text-emerald border-emerald/30",
  gray: "bg-surface-2 text-muted border-line",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  sky: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  violet: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export default function Badge({ children, tone = "gray", dot }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tones[tone]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />}
      {children}
    </span>
  );
}
