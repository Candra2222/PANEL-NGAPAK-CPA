import Link from "next/link";
import { Icon } from "@/components/icons";
import SiteLogo from "@/components/SiteLogo";

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

const orbitChips = [
  { label: "Sub ID", tone: "text-emerald", border: "border-emerald/40", delay: "0s" },
  { label: "Smartlink", tone: "text-sky-400", border: "border-sky-500/40", delay: "-6.5s" },
  { label: "Conversion", tone: "text-amber-400", border: "border-amber-500/40", delay: "-13s" },
  { label: "Payout", tone: "text-violet-400", border: "border-violet-500/40", delay: "-19.5s" },
];

const tickerWords = ["Publisher", "Sub ID", "Smartlink", "Conversion", "Payout", "Generate Link", "Live Traffic", "Bulk Generate", "Network", "Monetisasi"];

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden animate-page-enter">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-emerald/10 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full bg-sky-500/10 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 -right-24 w-[420px] h-[420px] rounded-full bg-violet-500/10 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.07)_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      <section className="relative text-center mb-14 max-w-3xl">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-10">
          <div className="absolute inset-0 rounded-full border border-dashed border-emerald/20 animate-spin-slow" />
          <div className="absolute inset-0 rounded-full border border-emerald/20 animate-pulse-ring" />
          <div className="absolute inset-0 rounded-full border border-emerald/20 animate-pulse-ring" style={{ animationDelay: "1s" }} />
          <div className="absolute inset-0 rounded-full border border-emerald/20 animate-pulse-ring" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <SiteLogo size={80} className="w-20 h-20 sm:w-24 sm:h-24 animate-glow-ring animate-float-y" />
          </div>
          {orbitChips.map((c) => (
            <div
              key={c.label}
              className="absolute left-1/2 top-1/2 animate-orbit"
              style={{ transformOrigin: "0 0", "--orbit-d": "26s", "--orbit-r": "clamp(74px, 20vw, 116px)", animationDelay: c.delay }}
            >
              <div className="-translate-y-[var(--orbit-r)]">
                <span
                  className={`inline-block animate-orbit-reverse whitespace-nowrap px-2.5 py-1.5 rounded-full bg-surface border ${c.border} ${c.tone} text-[11px] font-bold shadow-lg shadow-black/40`}
                  style={{ "--orbit-d": "26s" }}
                >
                  {c.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h1
          className="text-3xl lg:text-5xl font-bold tracking-tight max-w-3xl mx-auto opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          3 Panel Terpisah — Semua Berbasis{" "}
          <span className="bg-gradient-to-r from-emerald via-sky-400 to-emerald bg-clip-text text-transparent animate-shimmer-text">
            Password
          </span>
        </h1>
        <p
          className="text-muted mt-4 max-w-xl mx-auto text-sm sm:text-base leading-relaxed opacity-0 animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          Admin, Generate Link & Bulk, dan Realtime Monitor — satu ekosistem untuk publisher menuju conversion & payout.
        </p>
      </section>

      <section className="relative w-full max-w-5xl mb-14">
        <div className="grid md:grid-cols-3 gap-5">
          {panels.map((p, i) => (
            <Link
              key={p.href}
              href={p.href}
              className={`group relative bg-surface border rounded-2xl p-6 flex flex-col gap-4 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald/5 opacity-0 animate-fade-up ${p.ring}`}
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <span className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shine" />
              </span>
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl bg-emerald/10 border border-emerald/25 flex items-center justify-center ${p.tone} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon name={p.icon} className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-muted group-hover:text-emerald group-hover:translate-x-1 transition-all">
                  <Icon name="arrow" className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="font-bold">{p.title}</div>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{p.desc}</p>
              </div>
              <span className={`inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald/10 ${p.tone} border-emerald/30`}>
                {p.badge}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative w-full border-y border-line bg-surface/60 backdrop-blur py-3 mb-12 overflow-hidden">
        <div className="flex whitespace-nowrap w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-8 pr-8" aria-hidden={copy === 1}>
              {tickerWords.map((w) => (
                <span key={w} className="flex items-center gap-8 text-xs font-bold tracking-[0.22em] text-muted">
                  {w}
                  <Icon name="sparkle" className="w-3 h-3 text-emerald/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <p className="relative text-xs text-muted/60">
        <span className="text-muted/90 font-bold tracking-[0.22em] bg-gradient-to-r from-muted via-foreground to-muted bg-clip-text text-transparent animate-shimmer-text">
          POWERED BY SESEPUH
        </span>
      </p>
    </main>
  );
}
