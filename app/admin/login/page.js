"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import LoginSuccess from "@/components/LoginSuccess";
import { login } from "@/lib/auth";

export default function AdminLogin() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const onLogin = async (password) => {
    await login("admin", password);
    setDone(true);
    setTimeout(() => router.push("/admin/dashboard"), 900);
  };

  return (
    <LoginLayout accent="emerald" brand="CPA Link Panel" badge="PANEL 1 — ADMIN">
      <LoginForm
        accent="emerald"
        title="Masuk sebagai Admin"
        subtitle=""
        hint=""
        onLogin={onLogin}
      />
      {done && <LoginSuccess accent="emerald" title="Login Berhasil" subtitle="Selamat datang, Administrator" />}
    </LoginLayout>
  );
}
