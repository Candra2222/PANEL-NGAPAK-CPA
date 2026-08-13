"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { checkSession } from "@/lib/auth";

const nav = [
  { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/panels", icon: "users", label: "Sub ID / Member" },
  { href: "/admin/domains", icon: "globe", label: "Domain / DNS" },
  { href: "/admin/monitor-access", icon: "monitor", label: "Password Monitor" },
  { href: "/admin/change-password", icon: "key", label: "Ganti Password Admin" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    checkSession("admin").then((session) => {
      if (!active) return;
      if (!session) router.replace("/admin/login");
    });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <Shell
      brand="CPA Link Panel"
      sub="Admin Panel"
      panelKey="admin"
      user={{ name: "Administrator", subId: "ADMIN", initials: "AD" }}
      nav={nav}
      showClock
    >
      {children}
    </Shell>
  );
}
