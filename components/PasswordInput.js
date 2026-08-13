"use client";

import { useState } from "react";
import { Icon } from "./icons";

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  bgClass = "bg-navy",
  focusClass = "focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20",
  className = "",
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        <Icon name="lock" className="w-4 h-4" />
      </span>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full ${bgClass} border border-line rounded-lg pl-9.5 pr-10 py-2.5 text-sm placeholder:text-muted/40 focus:outline-none transition-all duration-200 ${focusClass} ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
      >
        <Icon
          key={show ? "off" : "on"}
          name={show ? "eye-off" : "eye"}
          className="w-4.5 h-4.5 animate-eye-pop"
        />
      </button>
    </div>
  );
}
