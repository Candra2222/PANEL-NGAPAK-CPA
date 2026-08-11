"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import CopyButton from "@/components/CopyButton";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";
import { mockDomains, timeAgo } from "@/lib/mock-data";

const CLOUDFLARE_IP = "76.76.21.21";
const TTL_OPTIONS = ["Auto", "1 min", "5 min", "1 hour", "1 day"];

export default function AdminDomains() {
  const [domains, setDomains] = useState(mockDomains);
  const [showAdd, setShowAdd] = useState(false);
  const [setupFor, setSetupFor] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [addForm, setAddForm] = useState({
    name: "",
    zone: "",
    record_type: "A",
    target: CLOUDFLARE_IP,
    proxied: true,
    ttl: "Auto",
  });

  const activeCount = domains.filter((d) => d.is_active).length;
  const verifiedCount = domains.filter((d) => d.dns_status === "verified").length;

  const addDomain = (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.zone.trim()) {
      pushToast({ title: "Lengkapi form", body: "Nama domain dan zone wajib diisi.", tone: "red" });
      return;
    }
    const full = addForm.name.trim().toLowerCase();
    if (domains.some((d) => d.name === full)) {
      pushToast({ title: "Domain sudah ada", body: full, tone: "red" });
      return;
    }
    const nd = {
      id: "d" + Date.now(),
      name: full,
      zone: addForm.zone.trim().toLowerCase(),
      is_active: true,
      dns_status: "pending",
      record_type: addForm.record_type,
      target: addForm.record_type === "CNAME" ? addForm.target.trim() : CLOUDFLARE_IP,
      proxied: addForm.proxied,
      ttl: addForm.ttl,
      added_at: new Date().toISOString(),
    };
    setDomains((prev) => [nd, ...prev]);
    setShowAdd(false);
    setAddForm({ name: "", zone: "", record_type: "A", target: CLOUDFLARE_IP, proxied: true, ttl: "Auto" });
    setSetupFor(nd.id);
    pushToast({ title: "Domain ditambahkan", body: "Lanjutkan setup DNS Cloudflare." });
  };

  const updateSetup = (patch) => {
    setDomains((prev) => prev.map((d) => (d.id === setupFor ? { ...d, ...patch } : d)));
  };

  const toggleActive = (id) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: !d.is_active } : d)));
    const d = domains.find((x) => x.id === id);
    pushToast({
      title: d.is_active ? "Domain dinonaktifkan" : "Domain diaktifkan",
      body: d.name,
      tone: d.is_active ? "amber" : "emerald",
    });
  };

  const verify = (id) => {
    setVerifying(true);
    pushToast({ title: "Memeriksa DNS...", body: "Menunggu propagasi & validasi Cloudflare.", tone: "sky" });
    setTimeout(() => {
      setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, dns_status: "verified" } : d)));
      setVerifying(false);
      setSetupFor(null);
      pushToast({ title: "DNS terverifikasi", body: "Domain siap dipakai untuk redirect link." });
    }, 2000);
  };

  const setupDomain = domains.find((d) => d.id === setupFor);

  return (
    <div>
      <PageHeader
        title="Domain / DNS"
        desc="Kelola domain redirect link (shortener) + setup DNS via Cloudflare. Domain aktif muncul di Panel 2."
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
        <StatCard icon="check" label="Aktif" value={activeCount} sub="Dipakai di Panel 2" tone="sky" />
        <StatCard icon="shield" label="DNS Verified" value={verifiedCount} tone="violet" />
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-bold">Daftar Domain Redirect</h2>
          <p className="text-xs text-muted mt-0.5">Dikelola di Cloudflare — member memilih domain ini saat generate link.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                <th className="px-5 py-3 font-semibold">Domain</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Record</th>
                <th className="px-5 py-3 font-semibold">Proxy</th>
                <th className="px-5 py-3 font-semibold">TTL</th>
                <th className="px-5 py-3 font-semibold">Dibuat</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                  <td className="px-5 py-3">
                    <div className="font-semibold font-mono text-sm">{d.name}</div>
                    <div className="text-xs text-muted">zone: {d.zone}</div>
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
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs text-muted">{d.record_type} → {d.target || "—"}</div>
                  </td>
                  <td className="px-5 py-3">
                    {d.proxied ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400">
                        <Icon name="globe" className="w-3.5 h-3.5" /> Proxied
                      </span>
                    ) : (
                      <span className="text-xs text-muted">DNS only</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{d.ttl}</td>
                  <td className="px-5 py-3 text-xs text-muted">{timeAgo(d.added_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSetupFor(d.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-line text-muted hover:text-emerald hover:border-emerald/40 transition-colors"
                      >
                        <Icon name="globe" className="w-3.5 h-3.5" />
                        Setup DNS
                      </button>
                      <button
                        onClick={() => toggleActive(d.id)}
                        className={`p-2 rounded-lg transition-colors ${d.is_active ? "text-muted hover:text-amber-400 hover:bg-amber-500/10" : "text-muted hover:text-emerald hover:bg-emerald/10"}`}
                        title={d.is_active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        <Icon name="shield" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Tambah Domain Redirect" onClose={() => setShowAdd(false)}>
          <form onSubmit={addDomain} className="space-y-4">
            <Field label="Nama Record (subdomain)">
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="contoh: go.panelcpa.my.id" className={inputCls} autoFocus />
            </Field>
            <Field label="Zone (domain utama di Cloudflare)">
              <input value={addForm.zone} onChange={(e) => setAddForm({ ...addForm, zone: e.target.value })} placeholder="contoh: panelcpa.my.id" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipe Record">
                <select
                  value={addForm.record_type}
                  onChange={(e) => setAddForm({ ...addForm, record_type: e.target.value })}
                  className={inputCls}
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                </select>
              </Field>
              <Field label="TTL">
                <select value={addForm.ttl} onChange={(e) => setAddForm({ ...addForm, ttl: e.target.value })} className={inputCls}>
                  {TTL_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            {addForm.record_type === "CNAME" ? (
              <Field label="CNAME Target (canonical redirect host)">
                <input value={addForm.target} onChange={(e) => setAddForm({ ...addForm, target: e.target.value })} placeholder="redirect.panel-cpa.id" className={`${inputCls} font-mono text-xs`} />
              </Field>
            ) : (
              <div className="bg-navy border border-line rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted">Target IP (hosting redirect)</div>
                  <div className="font-mono text-sm text-emerald font-bold">{CLOUDFLARE_IP}</div>
                </div>
                <CopyButton text={CLOUDFLARE_IP} />
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={addForm.proxied} onChange={(e) => setAddForm({ ...addForm, proxied: e.target.checked })} className="accent-emerald" />
                Proxy lewat Cloudflare (orange cloud)
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors">
                Batal
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors">
                Tambah Domain
              </button>
            </div>
          </form>
        </Modal>
      )}

      {setupDomain && (
        <Modal title={`Setup DNS — ${setupDomain.name}`} onClose={() => setSetupFor(null)}>
          <div className="space-y-4">
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg px-3.5 py-3 text-xs text-sky-300 flex gap-2">
              <Icon name="globe" className="w-4 h-4 shrink-0 mt-0.5" />
              Buka Cloudflare → pilih zone <span className="font-mono">{setupDomain.zone}</span> → menu DNS → tambahkan record berikut.
            </div>

            <div className="bg-navy border border-line rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Type</span>
                <select
                  value={setupDomain.record_type}
                  onChange={(e) => updateSetup({ record_type: e.target.value })}
                  className="bg-surface border border-line rounded-md px-2 py-1 text-xs font-semibold"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Name</span>
                <code className="text-xs text-emerald break-all">{setupDomain.name}</code>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted shrink-0">Target</span>
                <div className="flex items-center gap-2 min-w-0">
                  {setupDomain.record_type === "CNAME" ? (
                    <input
                      value={setupDomain.target}
                      onChange={(e) => updateSetup({ target: e.target.value })}
                      className="w-full bg-surface border border-line rounded-md px-2 py-1 text-xs font-mono"
                    />
                  ) : (
                    <code className="text-xs text-emerald">{CLOUDFLARE_IP}</code>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Proxy</span>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={setupDomain.proxied}
                    onChange={(e) => updateSetup({ proxied: e.target.checked })}
                    className="accent-emerald"
                  />
                  <span className={setupDomain.proxied ? "text-orange-400 font-semibold" : "text-muted"}>
                    {setupDomain.proxied ? "Proxied (orange cloud)" : "DNS only"}
                  </span>
                </label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">TTL</span>
                <select
                  value={setupDomain.ttl}
                  onChange={(e) => updateSetup({ ttl: e.target.value })}
                  className="bg-surface border border-line rounded-md px-2 py-1 text-xs font-semibold"
                >
                  {TTL_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <CopyButton
                text={`${setupDomain.record_type} ${setupDomain.name} → ${setupDomain.record_type === "CNAME" ? setupDomain.target : CLOUDFLARE_IP} (${setupDomain.proxied ? "proxied" : "DNS only"}, TTL ${setupDomain.ttl})`}
                label="Salin config"
              />
              <button
                onClick={() => verify(setupDomain.id)}
                disabled={verifying}
                className="flex-1 py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-60"
              >
                {verifying ? "Memverifikasi..." : "Verifikasi DNS"}
              </button>
            </div>
            <p className="text-xs text-muted/70 leading-relaxed">
              Catatan: integrasi API Cloudflare akan menyatu dengan backend. Preview ini menampilkan record yang harus dibuat manual di dashboard Cloudflare.
            </p>
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
