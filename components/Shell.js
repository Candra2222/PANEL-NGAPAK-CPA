"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { logout } from "@/lib/auth";
import Clock from "./Clock";
import ToastStack from "./ToastStack";

export default function Shell({ brand, sub, nav, user, panelKey, sidebar, showClock, headerStat, headerTitle, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const brandTone = panelKey === "admin" ? "text-emerald" : panelKey === "panel" ? "text-sky-400" : "text-amber-400";

  return (
    <div className="flex min-h-screen">
      <ToastStack />
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
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden ml-auto -mr-1 text-muted hover:text-foreground shrink-0"
            aria-label="Tutup menu"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
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
        <div className="px-3 py-2 border-t border-line shrink-0">
          <div className="flex items-center justify-center gap-2 px-2 py-0.5">
            <Icon name="bolt" className={`w-3.5 h-3.5 ${brandTone}`} />
            <span className="text-[10px] font-bold tracking-[0.22em] text-muted">
              POWERED BY <span className="text-foreground">SESEPUH</span>
            </span>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-[35] h-16 flex items-center gap-2 sm:gap-4 px-3 sm:px-5 bg-navy/80 backdrop-blur border-b border-line">
          <button onClick={() => setOpen(!open)} className="lg:hidden shrink-0 text-muted hover:text-foreground" aria-label="Menu">
            <Icon name="dashboard" className="w-6 h-6" />
          </button>
          {headerTitle && <span className="hidden md:inline text-lg font-bold truncate min-w-0">{headerTitle}</span>}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto min-w-0">
            {headerStat && (
              <div className="flex flex-col items-end leading-tight sm:pr-4 sm:border-r sm:border-line sm:mr-4">
                <span className="text-[10px] sm:text-[11px] text-muted whitespace-nowrap">{headerStat.label}</span>
                <span className="text-xs sm:text-sm font-bold text-emerald tabular-nums whitespace-nowrap">{headerStat.value}</span>
              </div>
            )}
            {showClock && <Clock />}
            {user && (
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-2/60 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold">{user.name}</span>
                    {user.subId && <span className="text-xs text-emerald font-mono">{user.subId}</span>}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center text-emerald font-bold text-sm">
                    {user.initials}
                  </div>
                  <Icon name="arrow" className={`w-3.5 h-3.5 text-muted hidden sm:block transition-transform ${profileOpen ? "rotate-90" : ""}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-line rounded-xl shadow-xl shadow-black/40 overflow-hidden animate-toast-in">
                    <div className="px-4 py-3 border-b border-line">
                      <div className="text-sm font-bold truncate">{user.name}</div>
                      {user.subId && <div className="text-xs text-emerald font-mono">{user.subId}</div>}
                    </div>
                    <button
                      onClick={() => logout(panelKey)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Icon name="logout" className="w-4.5 h-4.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main key={pathname} className="animate-page-enter p-4 sm:p-5 lg:p-8 pb-24 max-w-[1800px]">
          {children}
        </main>
      </div>
    </div>
  );
}
