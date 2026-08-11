"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import ToastStack from "@/components/ToastStack";
import { isAuthed } from "@/lib/auth";

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
    if (!isAuthed("admin")) router.replace("/admin/login");
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
      <ToastStack />
      {children}
    </Shell>
  );
}
