import Link from "next/link";
import { Icon } from "@/components/icons";

const panels = [
  {
    href: "/admin/login",
    icon: "shield",
    tone: "text-emerald",
    ring: "border-emerald/25 hover:border-emerald/50",
    title: "Panel 1 — Admin",
    desc: "Kelola Sub ID, reset password Panel 2 & 3, ganti password admin.",
    badge: "Password Admin",
  },
  {
    href: "/panel/login",
    icon: "link",
    tone: "text-sky-400",
    ring: "border-sky-500/25 hover:border-sky-400/50",
    title: "Panel 2 — Generate Link",
    desc: "Buat link single & bulk untuk Sub ID kamu. Sub ID otomatis tertanam.",
    badge: "Password per Sub ID",
  },
  {
    href: "/monitor/login",
    icon: "monitor",
    tone: "text-amber-400",
    ring: "border-amber-500/25 hover:border-amber-400/50",
    title: "Panel 3 — Realtime Monitor",
    desc: "Pantau live traffic & conversion semua Sub ID secara realtime.",
    badge: "Password Bersama",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-emerald/10 blur-3xl" />
      </div>
      <div className="relative text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 text-emerald">
          <Icon name="bolt" className="w-8 h-8" />
          <span className="font-bold text-2xl tracking-tight">CPA Link Panel</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold max-w-2xl mx-auto">
          3 Panel Terpisah — Semua Berbasis Password
        </h1>
        <p className="text-muted mt-3 max-w-xl mx-auto text-sm">
          Admin, Generate Link & Bulk, dan Realtime Monitor. Frontend preview dengan data mock.
        </p>
      </div>

      <div className="relative grid md:grid-cols-3 gap-5 w-full max-w-5xl">
        {panels.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`group bg-surface border rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 ${p.ring}`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-11 h-11 rounded-xl bg-emerald/10 border border-emerald/25 flex items-center justify-center ${p.tone}`}>
                <Icon name={p.icon} className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-muted group-hover:text-foreground transition-colors">
                <Icon name="arrow" className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="font-bold">{p.title}</div>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{p.desc}</p>
            </div>
            <span className="inline-flex self-start items-center px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald/10 text-emerald border-emerald/30">
              {p.badge}
            </span>
          </Link>
        ))}
      </div>

      <p className="relative mt-12 text-xs text-muted/60">
        Frontend Preview (Mock Data) — backend Supabase menyusul
      </p>
    </main>
  );
}
