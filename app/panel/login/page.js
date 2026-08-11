"use client";

import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import { setAuthed } from "@/lib/auth";
import { pushToast } from "@/components/ToastStack";
import { mockPanels } from "@/lib/mock-data";

export default function PanelLogin() {
  const router = useRouter();
  const demo = mockPanels.find((p) => p.is_active) || mockPanels[0];

  const onLogin = async (password) => {
    await new Promise((r) => setTimeout(r, 700));
    if (password.length < 3) throw new Error("Password minimal 3 karakter.");
    setAuthed("panel", { panelId: demo.id, name: demo.panel_name, subId: demo.sub_id });
    pushToast({ title: "Berhasil masuk", body: `Login sebagai ${demo.sub_id}.` });
    router.push("/panel/dashboard");
  };

  return (
    <LoginLayout accent="sky" brand="CPA Link Panel" badge="PANEL 2 — GENERATE LINK & BULK">
      <LoginForm
        accent="sky"
        title="Masuk ke Panel Member"
        subtitle={`1 password = 1 Sub ID. (Demo: login sebagai ${demo.sub_id})`}
        onLogin={onLogin}
      />
    </LoginLayout>
  );
}
