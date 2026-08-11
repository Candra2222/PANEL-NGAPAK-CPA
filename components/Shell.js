"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { logout } from "@/lib/auth";
import Clock from "./Clock";

export default function Shell({ brand, sub, nav, user, panelKey, sidebar, showClock, headerStat, headerTitle, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brandTone = panelKey === "admin" ? "text-emerald" : panelKey === "panel" ? "text-sky-400" : "text-amber-400";

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform bg-surface border-r border-line transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-line shrink-0">
          <div className={`w-9 h-9 rounded-lg bg-emerald/10 border border-emerald/30 flex items-center justify-center ${brandTone}`}>
            <Icon name="bolt" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight truncate">{brand}</div>
            <div className="text-xs text-muted truncate">{sub}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald/10 text-emerald border border-emerald/25"
                      : "text-muted hover:text-foreground hover:bg-surface-2 border border-transparent"
                  }`}
                >
                  <Icon name={item.icon} className="w-4.5 h-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {sidebar && <div className="px-3 pb-6">{sidebar}</div>}
        </div>
        <div className="p-3 border-t border-line shrink-0">
          <button
            onClick={() => logout(panelKey)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Icon name="logout" className="w-4.5 h-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-5 bg-navy/80 backdrop-blur border-b border-line">
          <button onClick={() => setOpen(!open)} className="lg:hidden text-muted hover:text-foreground" aria-label="Menu">
            <Icon name="dashboard" className="w-6 h-6" />
          </button>
          {headerTitle && <span className="text-lg font-bold hidden md:inline">{headerTitle}</span>}
          <div className="flex items-center gap-3 ml-auto">
            {headerStat && (
              <div className="hidden md:flex flex-col items-end leading-tight pr-4 border-r border-line mr-4">
                <span className="text-[11px] text-muted">{headerStat.label}</span>
                <span className="text-sm font-bold text-emerald tabular-nums">{headerStat.value}</span>
              </div>
            )}
            {showClock && <Clock />}
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold">{user.name}</span>
                  {user.subId && <span className="text-xs text-emerald font-mono">{user.subId}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center text-emerald font-bold text-sm">
                  {user.initials}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="p-5 lg:p-8 max-w-[1800px]">{children}</main>
      </div>
    </div>
  );
}
