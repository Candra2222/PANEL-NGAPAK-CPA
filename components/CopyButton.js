"use client";

import { useState } from "react";
import { Icon } from "./icons";

export default function CopyButton({ text, label = "Salin" }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
        copied
          ? "bg-emerald/15 text-emerald border-emerald/30"
          : "bg-surface-2 text-muted border-line hover:text-emerald hover:border-emerald/40"
      }`}
    >
      <Icon name={copied ? "check" : "copy"} className="w-3.5 h-3.5" />
      {copied ? "Tersalin" : label}
    </button>
  );
}
