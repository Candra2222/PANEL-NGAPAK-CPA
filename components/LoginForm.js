"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

const accents = {
  emerald: "text-emerald",
  sky: "text-sky-400",
  amber: "text-amber-400",
};

export default function LoginForm({
  accent = "emerald",
  title,
  subtitle,
  buttonLabel = "Masuk",
  hint = "Password bebas — contoh: demo",
  onLogin,
  footerLinks = [],
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accentClass = accents[accent] || accents.emerald;

  const submit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Masukkan password dulu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onLogin(password.trim());
    } catch (err) {
      setError(err.message || "Password salah.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>

      <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-navy border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20 placeholder:text-muted/50"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Tampilkan password"
            >
              <Icon name="eye" className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg py-2.5 text-sm font-bold bg-emerald hover:bg-emerald-dim transition-colors disabled:opacity-60 ${accentClass}`}
        >
          {loading ? "Memeriksa..." : buttonLabel}
        </button>

        <p className="text-center text-xs text-muted/70">{hint}</p>
      </div>

      {footerLinks.length > 0 && (
        <div className="flex justify-center gap-4 text-xs">
          {footerLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-emerald">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
