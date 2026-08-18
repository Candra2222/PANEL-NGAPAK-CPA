"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";

export default function AdminDomains() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [adding, setAdding] = useState(false);

  const [addForm, setAddForm] = useState({ name: "" });

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/domains");
      const data = await res.json();
      if (data.domains) setDomains(data.domains);
    } catch {
      pushToast({ title: "Gagal memuat domain", tone: "red" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  const activeCount = domains.filter((d) => d.is_active).length;
  const verifiedCount = domains.filter((d) => d.dns_status === "verified").length;

  const addDomain = async (e) => {
    e.preventDefault();
    const full = addForm.name.trim().toLowerCase();
    if (!full) {
      pushToast({ title: "Lengkapi form", body: "Nama domain wajib diisi.", tone: "red" });
      return;
    }
    if (domains.some((d) => d.name === full)) {
      pushToast({ title: "Domain sudah ada", body: full, tone: "red" });
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: full }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ title: "Gagal", body: data.error || "Terjadi kesalahan.", tone: "red" });
        return;
      }
      setDomains((prev) => [data.domain, ...prev]);
      setShowAdd(false);
      setAddForm({ name: "" });
      pushToast({ title: "Domain ditambahkan", body: `${full} — Custom Domain & Route aktif di Cloudflare.`, tone: "emerald" });
    } catch {
      pushToast({ title: "Gagal menghubungi server", tone: "red" });
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id) => {
    const d = domains.find((x) => x.id === id);
    if (!d) return;
    try {
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !d.is_active }),
      });
      const data = await res.json();
      if (res.ok && data.domain) {
        setDomains((prev) => prev.map((x) => (x.id === id ? data.domain : x)));
        pushToast({
          title: d.is_active ? "Domain dinonaktifkan" : "Domain diaktifkan",
          body: d.name,
          tone: d.is_active ? "amber" : "emerald",
        });
      }
    } catch {
      pushToast({ title: "Gagal update domain", tone: "red" });
    }
  };

  const deleteDomain = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/domains/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        pushToast({ title: "Domain dihapus", body: deleteTarget.name, tone: "red" });
      } else {
        pushToast({ title: "Gagal hapus", body: data.error, tone: "red" });
      }
    } catch {
      pushToast({ title: "Gagal menghubungi server", tone: "red" });
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Domain / DNS"
        desc="Kelola domain redirect. Tambah domain → otomatis terprovisi di Cloudflare (Custom Domain + Route)."
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Tambah Domain
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon="globe" label="Total Domain" value={domains.length} tone="emerald" />
        <StatCard icon="check" label="Aktif" value={activeCount} sub="Dipakai di Panel Member" tone="sky" />
        <StatCard icon="shield" label="DNS Verified" value={verifiedCount} tone="violet" />
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-bold">Daftar Domain Redirect</h2>
          <p className="text-xs text-muted mt-0.5">Domain otomatis terprovisi sebagai Custom Domain + Route di Cloudflare Worker.</p>
        </div>
        <div className="cpa-table-wrap">
          {loading ? (
            <div className="px-5 py-10 text-center text-muted text-sm">Memuat domain...</div>
          ) : (
            <table className="w-full text-sm cpa-table">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">Domain</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Tgl Pemasangan</th>
                  <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <div className="font-semibold font-mono text-sm">{d.name}</div>
                      {d.zone_id && (
                        <div className="text-[10px] text-muted mt-0.5">Zone: {d.zone_id.slice(0, 12)}...</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {d.dns_status === "verified" ? (
                        <Badge tone="green" dot>Verified</Badge>
                      ) : (
                        <Badge tone="amber" dot>Pending</Badge>
                      )}
                      <div className="mt-1">
                        <Badge tone={d.is_active ? "sky" : "gray"}>{d.is_active ? "Aktif" : "Nonaktif"}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {d.added_at
                        ? new Date(d.added_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(d.id)}
                          className={`p-2 rounded-lg transition-colors ${d.is_active ? "text-muted hover:text-amber-400 hover:bg-amber-500/10" : "text-muted hover:text-emerald hover:bg-emerald/10"}`}
                          title={d.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <Icon name="shield" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Hapus domain"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && domains.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted">
                      Belum ada domain. Klik &quot;Tambah Domain&quot; untuk menambah.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal title="Tambah Domain Redirect" onClose={() => !adding && setShowAdd(false)}>
          <form onSubmit={addDomain} className="space-y-4">
            <Field label="Nama Domain">
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ name: e.target.value })}
                placeholder="contoh: fumifun.sbs atau go.fumifun.sbs"
                className={inputCls}
                autoFocus
                disabled={adding}
              />
            </Field>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3.5 py-3 text-xs text-emerald-300 flex gap-2">
              <Icon name="globe" className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Otomatis terprovisi di Cloudflare:</div>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-200/80">
                  <li>Custom Domain diaktifkan untuk Worker</li>
                  <li>Wildcard Route (*.domain/*) ditambahkan</li>
                </ul>
                <div className="mt-1.5 text-emerald-300/70">Pastikan domain sudah terdaftar di zona Cloudflare yang sama.</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowAdd(false)} disabled={adding} className="px-4 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors">
                Batal
              </button>
              <button type="submit" disabled={adding} className="px-4 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-50">
                {adding ? "Memproses..." : "Tambah Domain"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Hapus Domain" onClose={() => setDeleteTarget(null)}>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-sm text-red-300 mb-5">
            Kamu akan menghapus domain <span className="font-mono font-semibold text-red-200">{deleteTarget.name}</span> dari Cloudflare dan database. Custom Domain & Route akan dihapus. Yakin mau lanjut?
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors">
              Batal
            </button>
            <button onClick={deleteDomain} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Hapus Domain
            </button>
          </div>
        </Modal>
      )}
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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 animate-toast-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg break-all">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground shrink-0 ml-3" aria-label="Tutup">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
