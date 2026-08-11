"use client";

import { useRouter } from "next/navigation";
import LoginLayout from "@/components/LoginLayout";
import LoginForm from "@/components/LoginForm";
import { setAuthed } from "@/lib/auth";
import { pushToast } from "@/components/ToastStack";

export default function AdminLogin() {
  const router = useRouter();

  const onLogin = async (password) => {
    await new Promise((r) => setTimeout(r, 700));
    if (password.length < 3) throw new Error("Password minimal 3 karakter.");
    setAuthed("admin");
    pushToast({ title: "Berhasil masuk", body: "Selamat datang di Admin Panel." });
    router.push("/admin/dashboard");
  };

  return (
    <LoginLayout accent="emerald" brand="CPA Link Panel" badge="PANEL 1 — ADMIN">
      <LoginForm
        accent="emerald"
        title="Masuk sebagai Admin"
        subtitle="Login hanya dengan password. Tanpa username."
        onLogin={onLogin}
      />
    </LoginLayout>
  );
}
