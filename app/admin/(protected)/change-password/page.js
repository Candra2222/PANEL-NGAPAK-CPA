"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/icons";
import PasswordInput from "@/components/PasswordInput";
import { pushToast } from "@/components/ToastStack";

export default function ChangePassword() {
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.old) return pushToast({ title: "Isi password lama", tone: "red" });
    if (form.next.length < 3) return pushToast({ title: "Password baru minimal 3 karakter", tone: "red" });
    if (form.next !== form.confirm) return pushToast({ title: "Konfirmasi tidak cocok", tone: "red" });

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: form.old, new_password: form.next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengganti password.");
      setDone(true);
      setForm({ old: "", next: "", confirm: "" });
      pushToast({ title: "Password admin diganti", body: "Simpan password baru di tempat aman." });
    } catch (err) {
      pushToast({ title: "Gagal", body: err.message, tone: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ganti Password Admin"
        desc="Password Panel 1 disimpan sebagai bcrypt hash dan bisa diganti sendiri kapan saja."
      />

      <div className="bg-surface border border-line rounded-xl p-6 max-w-lg">
        {done && (
          <div className="mb-5 bg-emerald/10 border border-emerald/30 rounded-lg px-4 py-3 flex items-center gap-2 text-emerald text-sm">
            <Icon name="check" className="w-4 h-4" />
            Password admin berhasil diganti.
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Password Lama">
            <PasswordInput value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} autoFocus />
          </Field>
          <Field label="Password Baru">
            <PasswordInput value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} placeholder="Minimal 3 karakter" />
          </Field>
          <Field label="Konfirmasi Password Baru">
            <PasswordInput value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Ganti Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
