"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import LoginSuccess from "@/components/LoginSuccess";
import { login } from "@/lib/auth";

export default function PanelLogin() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [welcome, setWelcome] = useState("");

  const onLogin = async (password) => {
    const session = await login("panel", password);
    setWelcome(`Selamat datang, ${session.sub_id || "Member"}`);
    setDone(true);
    setTimeout(() => router.push("/panel/dashboard"), 900);
  };

  return (
    <LoginLayout accent="sky" brand="CPA Link Panel" badge="PANEL 2 — GENERATE LINK & BULK">
      <LoginForm
        accent="sky"
        title="Masuk ke Panel Member"
        subtitle=""
        hint=""
        onLogin={onLogin}
      />
      {done && <LoginSuccess accent="sky" title="Login Berhasil" subtitle={welcome} />}
    </LoginLayout>
  );
}
