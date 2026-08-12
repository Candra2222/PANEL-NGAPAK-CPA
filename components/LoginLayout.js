import Link from "next/link";
import { Icon } from "./icons";

const accents = {
  emerald: {
    text: "text-emerald",
    blob: "bg-emerald/20",
    blob2: "bg-sky-500/10",
    grad: "from-emerald-400 to-emerald-600",
    glow: "rgba(16, 185, 129, 0.45)",
    badge: "text-emerald border-emerald/30 bg-emerald/10",
  },
  sky: {
    text: "text-sky-400",
    blob: "bg-sky-500/20",
    blob2: "bg-indigo-500/10",
    grad: "from-sky-400 to-sky-600",
    glow: "rgba(56, 189, 248, 0.45)",
    badge: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  },
  amber: {
    text: "text-amber-400",
    blob: "bg-amber-400/20",
    blob2: "bg-orange-500/10",
    grad: "from-amber-400 to-amber-500",
    glow: "rgba(251, 191, 36, 0.45)",
    badge: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  },
};

export default function LoginLayout({ accent = "emerald", brand, badge, children }) {
  const a = accents[accent] || accents.emerald;
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className={`absolute -top-36 -left-36 w-[28rem] h-[28rem] rounded-full blur-3xl animate-blob ${a.blob}`} />
        <div className={`absolute -bottom-40 -right-36 w-[28rem] h-[28rem] rounded-full blur-3xl animate-blob [animation-delay:-7s] ${a.blob2}`} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl animate-blob [animation-delay:-12s] bg-white/5" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(230, 237, 243, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(230, 237, 243, 1) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center gap-7">
        <Link href="/" className="group flex flex-col items-center gap-3 animate-fade-up">
          <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${a.grad} flex items-center justify-center text-white shadow-xl transition-transform duration-300 group-hover:scale-105`}>
            <Icon name="bolt" className="w-8 h-8 drop-shadow-md" />
            <div className="absolute inset-0 rounded-2xl animate-glow-ring" style={{ "--glow": a.glow }} />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tracking-tight">{brand}</div>
            {badge && (
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${a.badge}`}>
                {badge}
              </span>
            )}
          </div>
        </Link>
        {children}
      </div>

      <p className="relative mt-10 text-xs text-muted/60">CPA Link Panel System — Frontend Preview (Mock Data)</p>
    </div>
  );
}
