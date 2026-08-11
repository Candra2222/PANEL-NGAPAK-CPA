"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";

export default function ChangePassword() {
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.old) return pushToast({ title: "Isi password lama", tone: "red" });
    if (form.next.length < 8) return pushToast({ title: "Password baru minimal 8 karakter", tone: "red" });
    if (form.next !== form.confirm) return pushToast({ title: "Konfirmasi tidak cocok", tone: "red" });
    setDone(true);
    setForm({ old: "", next: "", confirm: "" });
    pushToast({ title: "Password admin diganti", body: "Simpan password baru di tempat aman." });
  };

  return (
    <div>
      <PageHeader
        title="Ganti Password Admin"
        desc="Password Panel 1 disimpan terenkripsi dan bisa diganti sendiri kapan saja."
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
            <input type="password" value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} className={inputCls} autoFocus />
          </Field>
          <Field label="Password Baru">
            <input type="password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} className={inputCls} placeholder="Minimal 8 karakter" />
          </Field>
          <Field label="Konfirmasi Password Baru">
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputCls} />
          </Field>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors">
            Ganti Password
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-navy border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
