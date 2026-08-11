"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import ToastStack from "@/components/ToastStack";
import { checkSession, getAuthedData } from "@/lib/auth";

const nav = [
  { href: "/panel/dashboard", icon: "link", label: "Generate Link" },
];

export default function PanelLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    checkSession("panel").then((session) => {
      if (!active) return;
      if (!session) router.replace("/panel/login");
    });
    return () => {
      active = false;
    };
  }, [router]);

  const data = getAuthedData("panel") || { panel_name: "Member", sub_id: "—" };
  const initials = (data.panel_name || "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Shell
      brand="CPA Link Panel"
      sub="Generate Link & Bulk"
      panelKey="panel"
      user={{ name: data.panel_name || "Member", initials }}
      nav={nav}
      showClock
    >
      <ToastStack />
      {children}
    </Shell>
  );
}
