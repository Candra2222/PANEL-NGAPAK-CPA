"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import CopyButton from "@/components/CopyButton";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";
import { panelById, mockRedirects, mockConversions, mockTraffic, formatNumber, formatCurrency, fullLink, timeAgo } from "@/lib/mock-data";
import { decryptPassword } from "@/lib/encrypt";

export default function PanelDetail() {
  const params = useParams();
  const router = useRouter();
  const panel = panelById(params.id);
  const [resetData, setResetData] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [resetPw, setResetPw] = useState("");

  if (!panel) {
    return (
      <div className="text-center py-24">
        <p className="text-muted">Member tidak ditemukan.</p>
        <button onClick={() => router.push("/admin/panels")} className="mt-4 text-emerald text-sm font-semibold hover:underline">
          Kembali ke daftar
        </button>
      </div>
    );
  }

  const links = mockRedirects.filter((r) => r.panel_id === panel.id);
  const clicks = links.reduce((s, r) => s + r.clicks, 0);
  const convs = mockConversions.filter((c) => c.panel_id === panel.id);
  const earning = convs.reduce((s, c) => s + c.earning, 0);
  const traffic = mockTraffic.filter((t) => t.panel_id === panel.id).slice(0, 6);

  return (
    <div>
      <PageHeader
        title={panel.panel_name}
        desc={<span className="font-mono text-emerald">{panel.sub_id}</span>}
        actions={
          <>
            <Badge tone={panel.is_active ? "green" : "red"} dot>{panel.is_active ? "Aktif" : "Nonaktif"}</Badge>
            <button
              onClick={() => setShowPass(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-emerald hover:border-emerald/40 transition-colors"
            >
              <Icon name="eye" className="w-4 h-4" />
              Lihat Password
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

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="link" label="Jumlah Link" value={formatNumber(links.length)} tone="sky" />
        <StatCard icon="chart" label="Total Click" value={formatNumber(clicks)} tone="violet" />
        <StatCard icon="bolt" label="Conversion" value={formatNumber(convs.length)} tone="emerald" />
        <StatCard icon="wallet" label="Earning" value={formatCurrency(earning, "USD")} sub={`≈ ${formatCurrency(earning, "IDR")}`} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-xl p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Info Member</h2>
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
              <dd>{clicks > 0 ? ((convs.length / clicks) * 100).toFixed(2) : "0.00"}%</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-bold">Daftar Link</h2>
            <span className="text-xs text-muted">{links.length} link</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {links.map((r) => (
                  <tr key={r.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3 font-semibold">{r.link_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{r.slug}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.clicks)}</td>
                    <td className="px-5 py-3 text-xs text-muted">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3 text-right">
                      <CopyButton text={fullLink(r.slug)} />
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
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
                  <div className="text-sm font-semibold truncate">{t.country} · {t.browser_app}</div>
                  <div className="text-xs text-muted truncate">{t.os_device} — {timeAgo(t.created_at)}</div>
                </div>
                <CopyButton text={t.ip_address} label="IP" />
              </div>
            ))}
          </div>
        </div>
      )}

      {resetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setResetForm(false)} />
          <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <h3 className="font-bold text-lg mb-1">Reset Password</h3>
            <p className="text-xs text-muted mb-4">
              Tulis password baru untuk <span className="font-mono text-emerald font-semibold">{panel.sub_id}</span> — ditulis manual oleh admin, tanpa kode acak.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (resetPw.trim().length < 3) {
                pushToast({ title: "Password terlalu pendek", body: "Minimal 3 karakter.", tone: "red" });
                return;
              }
              setResetData({ password: resetPw.trim() });
              setResetForm(false);
              setResetPw("");
              pushToast({ title: "Password direset", body: "Password baru ditampilkan di modal." });
            }} className="space-y-4">
              <input
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                placeholder="Tulis password baru..."
                className="w-full bg-navy border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20"
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
                  className="flex-1 py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setResetData(null)} />
          <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <h3 className="font-bold text-lg mb-4">Password Baru</h3>
            <div className="bg-navy border border-emerald/30 rounded-lg p-4 flex items-center justify-between gap-3">
              <span className="font-mono text-lg text-emerald font-bold">{resetData.password}</span>
              <CopyButton text={resetData.password} />
            </div>
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mt-4">
              Password disimpan terenkripsi (bukan di-hash), jadi admin tetap bisa melihatnya lagi lewat tombol &quot;Lihat Password&quot;.
            </p>
            <button
              onClick={() => setResetData(null)}
              className="mt-5 w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {showPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPass(false)} />
          <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <h3 className="font-bold text-lg mb-4">Password Panel 2</h3>
            <div className="bg-navy border border-emerald/30 rounded-lg p-4 flex items-center justify-between gap-3">
              <span className="font-mono text-lg text-emerald font-bold break-all">{decryptPassword(panel.password_enc)}</span>
              <CopyButton text={decryptPassword(panel.password_enc)} />
            </div>
            <p className="text-xs text-muted mt-4">
              Ditampilkan dari nilai terenkripsi (<span className="font-mono">{panel.password_enc}</span>) yang tersimpan — password di-dekripsi saat ditampilkan.
            </p>
            <button
              onClick={() => setShowPass(false)}
              className="mt-5 w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
