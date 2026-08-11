"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import CopyButton from "@/components/CopyButton";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";
import { mockPanels, mockRedirects, formatNumber, randomPassword, detectSubIdParams, isValidUrl } from "@/lib/mock-data";
import { encryptPassword } from "@/lib/encrypt";

let panelCounter = 1000;

export default function AdminPanels() {
  const [panels, setPanels] = useState(mockPanels);
  const [showModal, setShowModal] = useState(false);
  const [created, setCreated] = useState(null);
  const [query, setQuery] = useState("");
  const [resetFor, setResetFor] = useState(null);
  const [resetPw, setResetPw] = useState("");

  const [form, setForm] = useState({
    smartlink_url: "",
    param_key: "",
    panel_name: "",
    password: "",
    auto: true,
  });

  const detectedParams = detectSubIdParams(form.smartlink_url);
  const activeParam = detectedParams.find((p) => p.key === form.param_key) || detectedParams[0] || null;
  const detectedSubId = activeParam ? activeParam.value : null;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return panels.filter(
      (p) => p.sub_id.toLowerCase().includes(q) || p.panel_name.toLowerCase().includes(q)
    );
  }, [panels, query]);

  const create = (e) => {
    e.preventDefault();
    if (!form.smartlink_url.trim() || !form.panel_name.trim()) {
      pushToast({ title: "Lengkapi form", body: "URL Smartlink dan nama member wajib diisi.", tone: "red" });
      return;
    }
    if (!isValidUrl(form.smartlink_url)) {
      pushToast({ title: "URL Smartlink tidak valid", body: "Pastikan berupa URL lengkap (http/https).", tone: "red" });
      return;
    }
    if (!detectedSubId) {
      pushToast({
        title: "Sub ID tidak terdeteksi",
        body: "Tidak ada parameter sub id (mis. sub_id=...) pada URL Smartlink.",
        tone: "red",
      });
      return;
    }
    if (panels.some((p) => p.sub_id === detectedSubId)) {
      pushToast({ title: "Sub ID sudah ada", body: `"${detectedSubId}" sudah terdaftar.`, tone: "red" });
      return;
    }
    const password = form.auto ? randomPassword() : form.password;
    if (!form.auto && password.length < 3) {
      pushToast({ title: "Password terlalu pendek", body: "Minimal 3 karakter.", tone: "red" });
      return;
    }
    const newPanel = {
      id: "p" + ++panelCounter,
      sub_id: detectedSubId,
      panel_name: form.panel_name.trim(),
      smartlink_url: form.smartlink_url.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      last_login_at: null,
      password_enc: encryptPassword(password),
    };
    setPanels((prev) => [newPanel, ...prev]);
    setCreated({ ...newPanel, password });
    setShowModal(false);
    setForm({ smartlink_url: "", param_key: "", panel_name: "", password: "", auto: true });
    pushToast({ title: "Sub ID dibuat", body: `Password Panel 2 ditampilkan sekali di modal.` });
  };

  const toggleActive = (id) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
    const p = panels.find((x) => x.id === id);
    pushToast({
      title: p.is_active ? "Sub ID dinonaktifkan" : "Sub ID diaktifkan",
      body: p.sub_id,
      tone: p.is_active ? "amber" : "emerald",
    });
  };

  const remove = (id) => {
    const p = panels.find((x) => x.id === id);
    setPanels((prev) => prev.filter((x) => x.id !== id));
    pushToast({ title: "Sub ID dihapus", body: p.sub_id, tone: "red" });
  };

  const resetPassword = (id) => {
    setResetFor(id);
    setResetPw("");
  };

  const confirmReset = (e) => {
    e.preventDefault();
    if (resetPw.trim().length < 3) {
      pushToast({ title: "Password terlalu pendek", body: "Minimal 3 karakter.", tone: "red" });
      return;
    }
    setPanels((prev) => prev.map((p) => (p.id === resetFor ? { ...p, password_enc: encryptPassword(resetPw.trim()) } : p)));
    setCreated({ ...panels.find((x) => x.id === resetFor), password: resetPw.trim(), isReset: true });
    setResetFor(null);
    setResetPw("");
    pushToast({ title: "Password direset", body: "Password baru ditampilkan di modal." });
  };

  const activeCount = panels.filter((p) => p.is_active).length;
  const totalClicks = mockRedirects.reduce((s, r) => s + r.clicks, 0);

  return (
    <div>
      <PageHeader
        title="Sub ID / Member"
        desc="URL Smartlink diekstrak otomatis."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Buat Sub ID Baru
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon="users" label="Total Member" value={formatNumber(panels.length)} tone="emerald" />
        <StatCard icon="check" label="Aktif" value={formatNumber(activeCount)} tone="sky" />
        <StatCard icon="chart" label="Total Click" value={formatNumber(totalClicks)} tone="violet" />
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row gap-3 sm:items-center">
          <h2 className="font-bold sm:mr-auto">Daftar Sub ID</h2>
          <div className="relative sm:w-72">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari sub id / nama member..."
              className="w-full bg-navy border border-line rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald/60"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Sub ID</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Link</th>
                <th className="px-5 py-3 font-semibold text-right">Klik</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const links = mockRedirects.filter((r) => r.panel_id === p.id);
                const clicks = links.reduce((s, r) => s + r.clicks, 0);
                return (
                  <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/panels/${p.id}`} className="font-semibold hover:text-emerald">
                        {p.panel_name}
                      </Link>
                      <div className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString("id-ID")}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-emerald">{p.sub_id}</td>
                    <td className="px-5 py-3">
                      <Badge tone={p.is_active ? "green" : "red"} dot>{p.is_active ? "Aktif" : "Nonaktif"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{links.length}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(clicks)}</td>
                    <td className="px-5 py-3 text-muted text-xs">
                      {p.last_login_at ? new Date(p.last_login_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Belum login"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => resetPassword(p.id)}
                          className="p-2 rounded-lg text-muted hover:text-emerald hover:bg-emerald/10 transition-colors"
                          title="Reset password"
                        >
                          <Icon name="reset" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(p.id)}
                          className={`p-2 rounded-lg transition-colors ${p.is_active ? "text-muted hover:text-amber-400 hover:bg-amber-500/10" : "text-muted hover:text-emerald hover:bg-emerald/10"}`}
                          title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <Icon name="shield" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Hapus"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Buat Sub ID Baru" onClose={() => setShowModal(false)}>
          <form onSubmit={create} className="space-y-4">
            <Field label="URL Smartlink (diambil dari Trafee)">
              <input
                value={form.smartlink_url}
                onChange={(e) => setForm({ ...form, smartlink_url: e.target.value })}
                placeholder="https://smartlink.trafee.com/click?...&sub_id=..."
                className={`${inputCls} font-mono text-xs`}
                autoFocus
              />
            </Field>
            <div>
              <div className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Sub ID Terdeteksi</div>
              {detectedParams.length > 0 ? (
                <div className="bg-navy border border-emerald/30 rounded-lg px-3.5 py-3 space-y-2.5">
                  <div className="text-xs text-muted">
                    Smartlink ini punya <span className="text-emerald font-semibold">{detectedParams.length}</span> parameter kandidat. Pilih yang dipakai sebagai Sub ID:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedParams.map((p) => {
                      const isSel = activeParam && activeParam.key === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setForm({ ...form, param_key: p.key })}
                          className={`px-2.5 py-1 rounded-md border text-xs font-semibold font-mono transition-colors ${
                            isSel
                              ? "bg-emerald/15 text-emerald border-emerald/40"
                              : "bg-surface-2 text-muted border-line hover:text-foreground"
                          }`}
                          title={p.value}
                        >
                          {p.key}={p.value.length > 22 ? p.value.slice(0, 22) + "…" : p.value}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
                    <span className="text-xs text-muted">Sub ID yang dipilih</span>
                    <span className="font-mono text-sm text-emerald font-bold break-all text-right">{detectedSubId}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-navy border border-line rounded-lg px-3.5 py-2.5 text-xs text-muted">
                  Tunggu — masukkan URL Smartlink yang mengandung parameter Sub ID (mis. <code className="text-muted">sub_id=...</code>, <code className="text-muted">subsource=...</code>, <code className="text-muted">ext_click_id=...</code>, <code className="text-muted">track=...</code>)
                </div>
              )}
            </div>
            <Field label="Nama Member / Tim">
              <input
                value={form.panel_name}
                onChange={(e) => setForm({ ...form, panel_name: e.target.value })}
                placeholder="contoh: Tim Zulu"
                className={inputCls}
              />
            </Field>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.auto}
                  onChange={(e) => setForm({ ...form, auto: e.target.checked })}
                  className="accent-emerald"
                />
                Generate password otomatis
              </label>
            </div>
            {!form.auto && (
              <Field label="Password Panel 2 (manual)">
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 3 karakter"
                  className={inputCls}
                />
              </Field>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
              >
                Buat Sub ID
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetFor && (
        <Modal title="Reset Password Sub ID" onClose={() => setResetFor(null)}>
          <form onSubmit={confirmReset} className="space-y-4">
            <div className="bg-navy border border-line rounded-lg px-3.5 py-3 text-xs text-muted">
              Tulis password baru untuk{" "}
              <span className="font-mono text-emerald font-semibold">{(panels.find((x) => x.id === resetFor) || {}).sub_id}</span>.
              Password ditulis manual oleh admin — tanpa kode acak.
            </div>
            <Field label="Password Baru (ditulis manual)">
              <input
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                placeholder="Tulis password baru..."
                className={inputCls}
                autoFocus
              />
            </Field>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setResetFor(null)}
                className="px-4 py-2 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
              >
                Simpan Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {created && (
        <Modal title={created.isReset ? "Password Direset" : "Sub ID Berhasil Dibuat"} onClose={() => setCreated(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald">
              <Icon name="check" className="w-5 h-5" />
              <span className="text-sm font-semibold">{created.isReset ? "Password baru untuk member ini:" : "Salin data berikut & bagikan ke member:"}</span>
            </div>
            <div className="bg-navy border border-emerald/30 rounded-lg p-4 space-y-3">
              <InfoRow label="Sub ID" value={created.sub_id} mono />
              <InfoRow label="Nama Member" value={created.panel_name} />
              <InfoRow label="Smartlink" value={created.smartlink_url} mono break copy />
              <InfoRow label="Link Panel" value="/panel/login" mono />
              <InfoRow label="Password" value={created.password} mono highlight />
            </div>
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Password disimpan terenkripsi (bukan di-hash). Admin tetap bisa melihatnya lagi dari halaman detail member — tombol reset tetap tersedia per member.
            </p>
            <button
              onClick={() => {
                setCreated(null);
                pushToast({ title: "Disalin", body: "Gunakan tombol salin per baris.", tone: "sky" });
              }}
              className="w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
            >
              Tutup
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

function InfoRow({ label, value, mono, highlight, break: breakAll, copy }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className={`text-sm font-bold text-right ${mono ? "font-mono" : ""} ${highlight ? "text-emerald" : ""} ${breakAll ? "break-all" : "truncate"}`}>
        {value}
      </span>
      {copy && <CopyButton text={value} />}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 animate-toast-in">
        <div className="flex items-center justify-between mb-5">
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
