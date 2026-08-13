"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import PasswordInput from "./PasswordInput";

const accents = {
  emerald: {
    text: "text-emerald",
    focus: "focus:border-transparent focus:ring-emerald/20",
    line: "via-emerald/40",
    button: "from-emerald-400 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/45",
    link: "hover:text-emerald",
  },
  sky: {
    text: "text-sky-400",
    focus: "focus:border-transparent focus:ring-sky-400/20",
    line: "via-sky-400/40",
    button: "from-sky-400 to-sky-600 shadow-sky-500/25 hover:shadow-sky-500/45",
    link: "hover:text-sky-400",
  },
  amber: {
    text: "text-amber-400",
    focus: "focus:border-transparent focus:ring-amber-400/20",
    line: "via-amber-400/40",
    button: "from-amber-400 to-amber-500 shadow-amber-500/25 hover:shadow-amber-500/45",
    link: "hover:text-amber-400",
  },
};

export default function LoginForm({
  accent = "emerald",
  title,
  subtitle,
  buttonLabel = "Masuk",
  hint = "",
  onLogin,
  footerLinks = [],
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const a = accents[accent] || accents.emerald;

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
    <form onSubmit={submit} className="w-full max-w-sm space-y-5 animate-fade-up">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>

      <div className="relative rounded-2xl p-px bg-gradient-to-b from-white/15 via-white/5 to-transparent shadow-2xl shadow-black/40">
        <div className="relative rounded-[calc(1rem-1px)] bg-surface/95 backdrop-blur-xl px-6 py-7 space-y-4 overflow-hidden">
          <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${a.line} to-transparent`} />

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              bgClass="bg-navy/80"
              focusClass={`focus:ring-2 ${a.focus}`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 animate-fade-up">
              <Icon name="x" className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100 bg-gradient-to-r ${a.button}`}
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shine" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  {buttonLabel}
                  <Icon name="arrow" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </span>
          </button>

          {hint && <p className="text-center text-xs text-muted/70">{hint}</p>}
        </div>
      </div>

      {footerLinks.length > 0 && (
        <div className="flex justify-center gap-4 text-xs">
          {footerLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`text-muted transition-colors ${a.link}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
