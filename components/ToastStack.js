"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

let uid = 0;

export function pushToast({ title, body, tone = "emerald", duration = 4500 }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("cpa-toast", { detail: { id: ++uid, title, body, tone, duration } })
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
  const [active, setActive] = useState(null);
  const activeRef = useRef(null);
  const queueRef = useRef([]);
  const timerRef = useRef(null);

  const showNext = () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const next = queueRef.current.shift();
    activeRef.current = next || null;
    setActive(next || null);
  };

  const dismiss = (id) => {
    if (activeRef.current && activeRef.current.id === id) showNext();
  };

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      if (activeRef.current) {
        queueRef.current.push(t);
        return;
      }
      activeRef.current = t;
      setActive(t);
    };
    window.addEventListener("cpa-toast", onToast);
    return () => {
      window.removeEventListener("cpa-toast", onToast);
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => showNext(), active.duration || 4500);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  return (
    <div className="pointer-events-none fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col gap-2 sm:w-[360px]">
      {active && (
        <div
          key={active.id}
          className={`pointer-events-auto animate-toast-in bg-surface border rounded-xl p-4 shadow-xl shadow-black/40 ${toneStyles[active.tone]}`}
        >
          <div className="flex items-start gap-3">
            <Icon name="bolt" className={`w-5 h-5 mt-0.5 ${toneText[active.tone]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{active.title}</div>
              {active.body && <div className="text-xs text-muted mt-0.5">{active.body}</div>}
            </div>
            <button
              onClick={() => dismiss(active.id)}
              className="text-muted hover:text-foreground"
              aria-label="Tutup"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
