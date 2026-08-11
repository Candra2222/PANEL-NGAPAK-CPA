"use client";

import { useEffect, useState } from "react";

const fmt = (date, tz) =>
  date.toLocaleTimeString("en-GB", { hour12: false, timeZone: tz });

export default function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex flex-col items-end leading-tight pr-4 border-r border-line mr-4">
      <span className="text-[11px] font-semibold tabular-nums text-emerald">UTC {fmt(now, "UTC")}</span>
      <span className="text-[11px] font-semibold tabular-nums text-amber-400">WIB {fmt(now, "Asia/Jakarta")}</span>
    </div>
  );
}
