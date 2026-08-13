"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import LoginSuccess from "@/components/LoginSuccess";
import { setAuthed } from "@/lib/auth";

export default function MonitorLogin() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const onLogin = async (password) => {
    const res = await fetch("/api/monitor/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Gagal masuk.");
    setAuthed("monitor");
    setDone(true);
    setTimeout(() => router.push("/monitor/dashboard"), 900);
  };

  return (
    <LoginLayout accent="amber" brand="CPA Link Panel" badge="PANEL 3 — REALTIME MONITOR">
      <LoginForm
        accent="amber"
        title="Masuk ke Monitor"
        subtitle=""
        onLogin={onLogin}
      />
      {done && <LoginSuccess accent="amber" title="Login Berhasil" subtitle="Selamat datang di Realtime Monitor" />}
    </LoginLayout>
  );
}
