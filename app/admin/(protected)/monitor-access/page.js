"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import CopyButton from "@/components/CopyButton";
import StatCard from "@/components/StatCard";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";

export default function MonitorAccess() {
  const [newPassword, setNewPassword] = useState(null);
  const [pwInput, setPwInput] = useState("");

  const save = (e) => {
    e.preventDefault();
    if (pwInput.trim().length < 3) {
      pushToast({ title: "Password terlalu pendek", body: "Minimal 3 karakter.", tone: "red" });
      return;
    }
    setNewPassword(pwInput.trim());
    setPwInput("");
    pushToast({ title: "Password Monitor diganti", body: "Password baru ditampilkan. Bagikan ke semua member." });
  };

  return (
    <div>
      <PageHeader
        title="Password Panel 3 — Realtime Monitor"
        desc="Satu password bersama yang dipakai semua member untuk melihat data gabungan seluruh Sub ID. Password ditulis manual oleh admin."
        actions={
          <div className="flex items-center gap-2">
            <input
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Tulis password baru..."
              className="w-56 bg-navy border border-line rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20"
            />
            <button
              onClick={save}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
            >
              <Icon name="reset" className="w-4 h-4" />
              Ganti Password
            </button>
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard icon="shield" label="Akses" value="Password Bersama" sub="Satu untuk semua member" tone="amber" />
        <StatCard icon="eye" label="Hak Akses" value="Read Only" sub="Tidak bisa generate link" tone="sky" />
        <StatCard icon="users" label="Dibagikan ke" value="All Sub ID" sub="Gabungan seluruh data" tone="emerald" />
      </div>

      <div className="bg-surface border border-line rounded-xl p-6 max-w-2xl">
        <h2 className="font-bold mb-1">Password Saat Ini</h2>
        <p className="text-sm text-muted mb-5">
          Password disimpan terenkripsi (bukan di-hash), sehingga admin tetap bisa membacanya kembali saat dibutuhkan.
        </p>

        {newPassword ? (
          <div className="space-y-4">
            <div className="bg-navy border border-emerald/30 rounded-lg p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted mb-1">Password baru (tampil sekali)</div>
                <span className="font-mono text-xl text-emerald font-bold break-all">{newPassword}</span>
              </div>
              <CopyButton text={newPassword} />
            </div>
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Bagikan password ini ke semua member supaya mereka bisa memantau performa bersama. Password lama otomatis tidak berlaku.
            </p>
          </div>
        ) : (
          <div className="bg-navy border border-line rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Icon name="key" className="w-5 h-5 text-muted" />
              <div>
                <div className="text-sm font-semibold">Status: Terkunci</div>
                <div className="text-xs text-muted">Tulis password baru di kolom atas lalu tekan Ganti Password.</div>
              </div>
            </div>
            <BadgeGrey>Encrypted</BadgeGrey>
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeGrey({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-surface-2 text-muted border-line">
      {children}
    </span>
  );
}
