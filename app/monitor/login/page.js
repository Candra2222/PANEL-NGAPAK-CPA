"use client";

import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import { setAuthed } from "@/lib/auth";
import { pushToast } from "@/components/ToastStack";

export default function MonitorLogin() {
  const router = useRouter();

  const onLogin = async (password) => {
    const res = await fetch("/api/monitor/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Gagal masuk.");
    setAuthed("monitor");
    pushToast({ title: "Berhasil masuk", body: "Memuat data realtime seluruh Sub ID..." });
    router.push("/monitor/dashboard");
  };

  return (
    <LoginLayout accent="amber" brand="CPA Link Panel" badge="PANEL 3 — REALTIME MONITOR">
      <LoginForm
        accent="amber"
        title="Masuk ke Monitor"
        subtitle="Password bersama — data gabungan semua Sub ID."
        onLogin={onLogin}
      />
    </LoginLayout>
  );
}
