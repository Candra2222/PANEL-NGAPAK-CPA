import { Icon } from "./icons";

const accents = {
  emerald: { grad: "from-emerald-400 to-emerald-600", glow: "rgba(16, 185, 129, 0.45)" },
  sky: { grad: "from-sky-400 to-sky-600", glow: "rgba(56, 189, 248, 0.45)" },
  amber: { grad: "from-amber-400 to-amber-500", glow: "rgba(251, 191, 36, 0.45)" },
};

export default function LoginSuccess({ accent = "emerald", title = "Login Berhasil", subtitle }) {
  const a = accents[accent] || accents.emerald;
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 px-6 bg-navy/85 backdrop-blur-sm animate-overlay-in">
      <div
        className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${a.grad} flex items-center justify-center text-white shadow-xl animate-success-pop`}
      >
        <Icon name="bolt" className="w-9 h-9 drop-shadow-md" />
        <div className="absolute inset-0 rounded-2xl animate-success-ring" style={{ "--glow": a.glow }} />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
      </div>
      <div className="text-center animate-fade-up">
        <div className="text-xl font-bold">{title}</div>
        {subtitle && <div className="text-sm text-muted mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
