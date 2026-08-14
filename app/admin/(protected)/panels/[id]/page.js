"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import CopyButton from "@/components/CopyButton";
import { Icon } from "@/components/icons";
import PasswordInput from "@/components/PasswordInput";
import { pushToast } from "@/components/ToastStack";
import { formatNumber, formatCurrency, fullLink, timeAgo } from "@/lib/mock-data";

export default function PanelDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [resetForm, setResetForm] = useState(false);
  const [resetPw, setResetPw] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    return fetch(`/api/admin/panels/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not-found"))))
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const api = async (url, options = {}) => {
    const res = await fetch(url, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Terjadi kesalahan.");
    return body;
  };

  const toggleActive = async () => {
    try {
      const d = await api(`/api/admin/panels/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-active", is_active: !data.panel.is_active }),
      });
      setData((prev) => ({ ...prev, panel: { ...prev.panel, is_active: d.is_active } }));
      pushToast({ title: d.is_active ? "Diaktifkan" : "Dinonaktifkan", body: data.panel.sub_id, tone: d.is_active ? "emerald" : "amber" });
    } catch (err) {
      pushToast({ title: "Gagal", body: err.message, tone: "red" });
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (resetPw.trim().length < 3) {
      pushToast({ title: "Password terlalu pendek", body: "Minimal 3 karakter.", tone: "red" });
      return;
    }
    setBusy(true);
    try {
      const d = await api(`/api/admin/panels/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", password: resetPw.trim() }),
      });
      setResetData(d.password);
      setResetForm(false);
      setResetPw("");
      pushToast({ title: "Password direset", body: "Password baru ditampilkan di modal." });
    } catch (err) {
      pushToast({ title: "Gagal", body: err.message, tone: "red" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted">Memuat...</div>;
  }

  if (notFound || !data?.panel) {
    return (
      <div className="text-center py-24">
        <p className="text-muted">Member tidak ditemukan.</p>
        <button onClick={() => router.push("/admin/panels")} className="mt-4 text-emerald text-sm font-semibold hover:underline">
          Kembali ke daftar
        </button>
      </div>
    );
  }

  const { panel, redirects, conversions, traffic } = data;
  const clicks = redirects.reduce((s, r) => s + r.clicks, 0);
  const earning = conversions.reduce((s, c) => s + Number(c.earning || 0), 0);

  return (
    <div>
      <PageHeader
        title={panel.sub_id}
        desc={panel.panel_name && panel.panel_name !== panel.sub_id ? panel.panel_name : "Detail Sub ID"}
        actions={
          <>
            <Badge tone={panel.is_active ? "green" : "red"} dot>{panel.is_active ? "Aktif" : "Nonaktif"}</Badge>
            <button
              onClick={toggleActive}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-emerald hover:border-emerald/40 transition-colors"
            >
              <Icon name="shield" className="w-4 h-4" />
              {panel.is_active ? "Nonaktifkan" : "Aktifkan"}
            </button>
            <button
              onClick={() => {
                setResetForm(true);
                setResetPw("");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-emerald hover:border-emerald/40 transition-colors"
            >
              <Icon name="reset" className="w-4 h-4" />
              Reset Password
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="link" label="Jumlah Link" value={formatNumber(redirects.length)} tone="sky" />
        <StatCard icon="chart" label="Total Click" value={formatNumber(clicks)} tone="violet" />
        <StatCard icon="bolt" label="Conversion" value={formatNumber(conversions.length)} tone="emerald" />
        <StatCard icon="wallet" label="Earning" value={formatCurrency(earning, "USD")} sub={`≈ ${formatCurrency(earning, "IDR")}`} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-xl p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Info Sub ID</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sub ID</dt>
              <dd className="font-mono text-emerald">{panel.sub_id}</dd>
            </div>
            <div className="flex justify-between gap-3 items-start">
              <dt className="text-muted shrink-0">Smartlink</dt>
              <dd className="text-xs text-muted break-all text-right">{panel.smartlink_url}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Dibuat</dt>
              <dd>{new Date(panel.created_at).toLocaleDateString("id-ID")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Last Login</dt>
              <dd>{panel.last_login_at ? timeAgo(panel.last_login_at) : "Belum login"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">CTR</dt>
              <dd>{clicks > 0 ? ((conversions.length / clicks) * 100).toFixed(2) : "0.00"}%</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-bold">Daftar Link</h2>
            <span className="text-xs text-muted">{redirects.length} link</span>
          </div>
          <div className="cpa-table-wrap">
            <table className="w-full text-sm cpa-table">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">Nama Link</th>
                  <th className="px-5 py-3 font-semibold">Slug</th>
                  <th className="px-5 py-3 font-semibold text-right">Klik</th>
                  <th className="px-5 py-3 font-semibold text-right">Dibuat</th>
                  <th className="px-5 py-3 font-semibold text-right">Link</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((r) => (
                  <tr key={r.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3 font-semibold">{r.link_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{r.slug}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.clicks)}</td>
                    <td className="px-5 py-3 text-xs text-muted">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3 text-right">
                      <CopyButton text={fullLink(r.slug, r.domain || (typeof window !== "undefined" ? window.location.host : ""))} />
                    </td>
                  </tr>
                ))}
                {redirects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted">Belum ada link.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {traffic.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-5">
          <h2 className="font-bold mb-4">Traffic Terbaru</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {traffic.map((t) => (
              <div key={t.id} className="bg-navy border border-line rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{t.country || "—"} · {t.browser_app || "—"}</div>
                  <div className="text-xs text-muted truncate">{t.os_device || "—"} — {timeAgo(t.created_at)}</div>
                </div>
                <CopyButton text={t.ip_address || ""} label="IP" />
              </div>
            ))}
          </div>
        </div>
      )}

      {resetForm && (
        <Modal title="Reset Password" onClose={() => setResetForm(false)}>
          <p className="text-xs text-muted mb-4">
            Tulis password baru untuk <span className="font-mono text-emerald font-semibold">{panel.sub_id}</span> — ditulis manual oleh admin, tanpa kode acak.
          </p>
          <form onSubmit={submitReset} className="space-y-4">
            <PasswordInput
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
              placeholder="Tulis password baru..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-60"
              >
                {busy ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetData && (
        <Modal title="Password Baru" onClose={() => setResetData(null)}>
          <div className="bg-navy border border-emerald/30 rounded-lg p-4 flex items-center justify-between gap-3">
            <span className="font-mono text-lg text-emerald font-bold">{resetData}</span>
            <CopyButton text={resetData} />
          </div>
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mt-4">
            Password disimpan sebagai bcrypt hash & tidak bisa dilihat lagi. Bagikan ke member terkait.
          </p>
          <button
            onClick={() => setResetData(null)}
            className="mt-5 w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
          >
            Tutup
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl p-6 animate-toast-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Tutup">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
