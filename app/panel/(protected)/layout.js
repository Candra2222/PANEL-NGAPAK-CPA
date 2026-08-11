"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import ToastStack from "@/components/ToastStack";
import { isAuthed, getAuthedData } from "@/lib/auth";

const nav = [
  { href: "/panel/dashboard", icon: "link", label: "Generate Link" },
];

export default function PanelLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed("panel")) router.replace("/panel/login");
  }, [router]);

  const data = getAuthedData("panel") || { name: "Demo Member", subId: "trafee_001" };
  const initials = (data.name || "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Shell
      brand="CPA Link Panel"
      sub="Generate Link & Bulk"
      panelKey="panel"
      user={{ name: data.name, initials }}
      nav={nav}
      showClock
    >
      <ToastStack />
      {children}
    </Shell>
  );
}
