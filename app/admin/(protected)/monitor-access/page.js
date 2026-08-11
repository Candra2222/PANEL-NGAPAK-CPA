"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CopyButton from "@/components/CopyButton";
import StatCard from "@/components/StatCard";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";

export default function MonitorAccess() {
  const [newPassword, setNewPassword] = useState(null);
  const [pwInput, setPwInput] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/monitor-access")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setStatus(d));
    return () => {
      active = false;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (pwInput.trim() && pwInput.trim().length < 3) {
      pushToast({ title: "Password terlalu pendek", body: "Minimal 3 karakter.", tone: "red" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/monitor-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", password: pwInput.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengganti password.");
      setNewPassword(data.password);
      setPwInput("");
      setStatus({ exists: true });
      pushToast({
        title: "Password Monitor diganti",
        body: pwInput.trim() ? "Password baru ditampilkan. Bagikan ke semua member." : "Password acak baru dibuat. Bagikan ke semua member.",
      });
    } catch (err) {
      pushToast({ title: "Gagal", body: err.message, tone: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Password Panel 3 — Realtime Monitor"
        desc="Satu password bersama yang dipakai semua member untuk melihat data gabungan seluruh Sub ID. Bisa ditulis manual atau digenerate otomatis."
        actions={
          <div className="flex items-center gap-2">
            <input
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Kosongkan utk generate otomatis..."
              className="w-60 bg-navy border border-line rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20"
            />
            <button
              onClick={save}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-60"
            >
              <Icon name="reset" className="w-4 h-4" />
              {loading ? "Menyimpan..." : "Ganti Password"}
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
          Password disimpan sebagai bcrypt hash (tidak bisa dibaca ulang). Saat diganti, password baru
          ditampilkan sekali untuk disalin & dibagikan.
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
                <div className="text-sm font-semibold">
                  Status: {status === null ? "Memeriksa..." : status.exists ? "Aktif" : "Belum di-set"}
                </div>
                <div className="text-xs text-muted">
                  {status?.exists
                    ? "Password sudah dibuat. Ganti kapan saja untuk me-reset."
                    : "Belum ada password Panel 3. Tulis atau biarkan kosong lalu tekan Ganti Password."}
                </div>
              </div>
            </div>
            <BadgeGrey>{status?.exists ? "Hashed" : "Pending"}</BadgeGrey>
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
