"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

let uid = 0;

export function pushToast({ title, body, tone = "emerald" }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("cpa-toast", { detail: { id: ++uid, title, body, tone } })
  );
}

const toneStyles = {
  emerald: "border-emerald/40",
  sky: "border-sky-400/40",
  amber: "border-amber-400/40",
  red: "border-red-400/40",
  violet: "border-violet-400/40",
};

const toneText = {
  emerald: "text-emerald",
  sky: "text-sky-400",
  amber: "text-amber-400",
  red: "text-red-400",
  violet: "text-violet-400",
};

export default function ToastStack() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const timersMap = timers.current;
    const onToast = (e) => {
      const t = e.detail;
      setToasts((prev) => [...prev, t]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
        timersMap.delete(t.id);
      }, 4500);
      timersMap.set(t.id, timer);
    };
    window.addEventListener("cpa-toast", onToast);
    return () => {
      window.removeEventListener("cpa-toast", onToast);
      timersMap.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col gap-2 sm:w-[360px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-toast-in bg-surface border rounded-xl p-4 shadow-xl shadow-black/40 ${toneStyles[t.tone]}`}
        >
          <div className="flex items-start gap-3">
            <Icon name="bolt" className={`w-5 h-5 mt-0.5 ${toneText[t.tone]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{t.title}</div>
              {t.body && <div className="text-xs text-muted mt-0.5">{t.body}</div>}
            </div>
            <button
              onClick={() => {
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
                clearTimeout(timers.current.get(t.id));
                timers.current.delete(t.id);
              }}
              className="text-muted hover:text-foreground"
              aria-label="Tutup"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
