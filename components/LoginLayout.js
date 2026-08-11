import Link from "next/link";
import { Icon } from "./icons";

const accents = {
  emerald: "text-emerald",
  sky: "text-sky-400",
  amber: "text-amber-400",
};

export default function LoginLayout({ accent = "emerald", brand, badge, children }) {
  const accentClass = accents[accent] || accents.emerald;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm flex flex-col items-center gap-7">
        <Link href="/" className="flex flex-col items-center gap-3 group">
          <div className={`w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/30 flex items-center justify-center ${accentClass} group-hover:scale-105 transition-transform`}>
            <Icon name="bolt" className="w-7 h-7" />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{brand}</div>
            {badge && (
              <span className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${accentClass} border-current/20 bg-emerald/10`}>
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
