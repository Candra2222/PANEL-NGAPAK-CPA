"use client";

import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import { login } from "@/lib/auth";
import { pushToast } from "@/components/ToastStack";

export default function PanelLogin() {
  const router = useRouter();

  const onLogin = async (password) => {
    const session = await login("panel", password);
    pushToast({ title: "Berhasil masuk", body: `Login sebagai ${session.sub_id}.` });
    router.push("/panel/dashboard");
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
    </LoginLayout>
  );
}
