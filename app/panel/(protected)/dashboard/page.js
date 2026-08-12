"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import CopyButton from "@/components/CopyButton";
import { Icon } from "@/components/icons";
import { pushToast } from "@/components/ToastStack";
import { getAuthedData } from "@/lib/auth";
import { formatNumber, formatCurrency, fullLink } from "@/lib/mock-data";

export default function PanelDashboard() {
  const session = getAuthedData("panel") || { sub_id: "—", panel_name: "Member", smartlink_url: "", domains: [] };
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({ links: 0, clicks: 0, conversions: 0, earning: 0 });
  const [smartlink, setSmartlink] = useState(session.smartlink_url || "");
  const [panelName, setPanelName] = useState(session.panel_name);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const domains = session.domains?.length ? session.domains : [typeof window !== "undefined" ? window.location.host : ""].filter(Boolean);
  const defaultDomain = domains[0];

  const [tab, setTab] = useState("single");
  const [preview, setPreview] = useState(null);
  const [ogPrompt, setOgPrompt] = useState(false);
  const [deleteAllPrompt, setDeleteAllPrompt] = useState(false);
  const [deleteOneTarget, setDeleteOneTarget] = useState(null);

  const [single, setSingle] = useState({
    slug: "",
    use_random_slug: true,
    domain: defaultDomain,
    redirect_mode: "direct",
    og_title: "",
    og_description: "",
    og_image: "",
  });

  const [bulk, setBulk] = useState({
    count: 1,
    domain: defaultDomain,
    redirect_mode: "direct",
  });

  const load = () => {
    return fetch("/api/panel/redirects")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Gagal memuat data."))))
      .then((d) => {
        setLinks(d.redirects || []);
        setStats(d.stats || { links: 0, clicks: 0, conversions: 0, earning: 0 });
        setSmartlink(d.panel?.smartlink_url || smartlink);
        setPanelName(d.panel?.panel_name || panelName);
      })
      .catch((e) => pushToast({ title: "Gagal memuat data", body: e.message, tone: "red" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
    return data;
  };

  const submitSingle = async (mode) => {
    setBusy(true);
    try {
      const data = await api("/api/panel/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "single",
          slug: single.use_random_slug ? undefined : single.slug,
          link_name: panelName,
          domain: single.domain,
          redirect_mode: mode,
          og_title: single.og_title,
          og_description: single.og_description,
          og_image: single.og_image,
        }),
      });
      const link = data.redirects[0];
      setLinks((prev) => [link, ...prev]);
      setStats((s) => ({ ...s, links: s.links + 1 }));
      setPreview(link);
      pushToast({ title: "Link berhasil dibuat", body: fullLink(link.slug, link.domain || defaultDomain) });
      setSingle({ ...single, slug: "" });
    } catch (err) {
      pushToast({ title: "Gagal membuat", body: err.message, tone: "red" });
    } finally {
      setBusy(false);
    }
  };

  const createSingle = async (e) => {
    e.preventDefault();
    const ogEmpty = !single.og_title.trim() && !single.og_description.trim() && !single.og_image.trim();
    if (ogEmpty) {
      setOgPrompt(true);
      return;
    }
    submitSingle(single.redirect_mode);
  };

  const createBulk = async (e) => {
    e.preventDefault();
    const count = Math.max(1, parseInt(bulk.count, 10) || 0);
    if (count < 1) {
      pushToast({ title: "Jumlah link minimal 1", tone: "red" });
      return;
    }
    setBusy(true);
    try {
      const data = await api("/api/panel/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bulk",
          count,
          domain: bulk.domain,
          redirect_mode: bulk.redirect_mode,
        }),
      });
      const created = data.redirects || [];
      setLinks((prev) => [...created, ...prev]);
      setStats((s) => ({ ...s, links: s.links + created.length }));
      pushToast({ title: `${created.length} link berhasil dibuat`, body: "Sub ID & Smartlink otomatis tertanam." });
    } catch (err) {
      pushToast({ title: "Gagal membuat", body: err.message, tone: "red" });
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteLink = (l) => {
    setDeleteOneTarget(l);
  };

  const deleteLink = async () => {
    const l = deleteOneTarget;
    if (!l) return;
    setBusy(true);
    try {
      await api(`/api/panel/redirects/${l.id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((x) => x.id !== l.id));
      setStats((s) => ({ ...s, links: s.links - 1 }));
      setDeleteOneTarget(null);
      pushToast({ title: "Link dihapus", body: fullLink(l.slug, l.domain || defaultDomain), tone: "red" });
    } catch (err) {
      pushToast({ title: "Gagal menghapus", body: err.message, tone: "red" });
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    setBusy(true);
    try {
      await api("/api/panel/redirects", { method: "DELETE" });
      setLinks([]);
      setStats((s) => ({ ...s, links: 0 }));
      setDeleteAllPrompt(false);
      pushToast({ title: "Semua link dihapus", body: "Daftar link kamu sekarang kosong.", tone: "red" });
    } catch (err) {
      pushToast({ title: "Gagal menghapus", body: err.message, tone: "red" });
    } finally {
      setBusy(false);
    }
  };

  const subId = session.sub_id;

  return (
    <div>
      <PageHeader
        title="Generate Link & Bulk"
        desc="Link single bisa diatur OG meta; bulk cukup set jumlah & domain lalu langsung generate — destinasi otomatis mengikuti sub id Smartlink."
        actions={
          <Badge tone="sky" dot>
            Sub ID: <span className="font-mono">{subId}</span>
          </Badge>
        }
      />

      <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-sm text-sky-300">
        <Icon name="shield" className="w-5 h-5 shrink-0" />
        <div>
          Sub ID <span className="font-mono font-bold">{subId}</span> full Access fitur. Setiap link sudah mengarah ke Smartlink.
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="link" label="Total Link" value={formatNumber(stats.links)} tone="sky" />
        <StatCard icon="chart" label="Total Click" value={formatNumber(stats.clicks)} tone="violet" />
        <StatCard icon="bolt" label="Conversion" value={formatNumber(stats.conversions)} tone="emerald" />
        <StatCard icon="wallet" label="Earning" value={formatCurrency(stats.earning, "USD")} sub={`≈ ${formatCurrency(stats.earning, "IDR")}`} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2 bg-surface border border-line rounded-xl">
          <div className="flex border-b border-line">
            <button
              onClick={() => setTab("single")}
              className={`flex-1 py-3 text-sm font-bold transition-colors rounded-tl-xl ${tab === "single" ? "text-emerald bg-surface-2 border-b-2 border-emerald" : "text-muted hover:text-foreground"}`}
            >
              Single Link
            </button>
            <button
              onClick={() => setTab("bulk")}
              className={`flex-1 py-3 text-sm font-bold transition-colors rounded-tr-xl ${tab === "bulk" ? "text-emerald bg-surface-2 border-b-2 border-emerald" : "text-muted hover:text-foreground"}`}
            >
              Bulk Generate
            </button>
          </div>

          <div className="p-5">
            <div className="mb-4 bg-navy border border-line rounded-lg px-3.5 py-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted shrink-0">Nama Link</span>
                <span className="text-sm font-bold text-right">{panelName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted shrink-0">Destinasi</span>
                <span className="text-[11px] text-muted break-all text-right">{smartlink}</span>
              </div>
            </div>

            {tab === "single" ? (
              <form onSubmit={createSingle} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm mb-2">
                    <input type="checkbox" checked={single.use_random_slug} onChange={(e) => setSingle({ ...single, use_random_slug: e.target.checked })} className="accent-emerald" />
                    Slug acak otomatis (6 karakter huruf & angka)
                  </label>
                </div>
                {!single.use_random_slug && (
                  <Field label="Slug Custom">
                    <input value={single.slug} onChange={(e) => setSingle({ ...single, slug: e.target.value })} placeholder="misal: promo-agustus" className={inputCls} />
                  </Field>
                )}
                <Field label="Pilih Domain">
                  <DomainSelect
                    value={single.domain}
                    onChange={(v) => setSingle({ ...single, domain: v })}
                    domains={domains}
                  />
                </Field>
                <p className="text-[11px] text-muted/70 -mt-3">
                  Domain default gratis Cloudflare (workers.dev) — custom domain bisa ditambahkan admin nanti.
                </p>
                <RedirectModeField value={single.redirect_mode} onChange={(v) => setSingle({ ...single, redirect_mode: v })} />
                <Field label="OG Title">
                  <input value={single.og_title} onChange={(e) => setSingle({ ...single, og_title: e.target.value })} placeholder="Judul preview saat dibagikan" className={inputCls} />
                </Field>
                <Field label="OG Description">
                  <textarea value={single.og_description} onChange={(e) => setSingle({ ...single, og_description: e.target.value })} className={`${inputCls} resize-none`} rows={2} placeholder="Deskripsi preview" />
                </Field>
                <Field label="OG Image URL">
                  <input value={single.og_image} onChange={(e) => setSingle({ ...single, og_image: e.target.value })} placeholder="https://...gambar.jpg" className={inputCls} />
                </Field>
                <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-60">
                  {busy ? "Membuat..." : "Buat Link"}
                </button>
              </form>
            ) : (
              <form onSubmit={createBulk} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jumlah Link">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={bulk.count}
                      onChange={(e) => setBulk({ ...bulk, count: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Pilih Domain">
                    <DomainSelect
                      value={bulk.domain}
                      onChange={(v) => setBulk({ ...bulk, domain: v })}
                      domains={domains}
                    />
                  </Field>
                </div>
                <p className="text-[11px] text-muted/70 -mt-2">
                  Domain default gratis Cloudflare (workers.dev) — custom domain bisa ditambahkan admin nanti.
                </p>
                <RedirectModeField value={bulk.redirect_mode} onChange={(v) => setBulk({ ...bulk, redirect_mode: v })} />
                <p className="text-xs text-muted -mt-1">
                  Cukup set jumlah link & pilih domain — {Math.max(1, parseInt(bulk.count, 10) || 1)} link langsung dibuat dengan slug acak, Sub ID & Smartlink otomatis tertanam.
                </p>
                <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors disabled:opacity-60">
                  {busy ? "Membuat..." : `Generate ${Math.max(1, parseInt(bulk.count, 10) || 1)} Link`}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-bold">Daftar Link Kamu</h2>
            <div className="flex items-center gap-2.5">
              {!loading && links.length > 0 && (
                <button
                  onClick={() => setDeleteAllPrompt(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  title="Hapus semua link"
                >
                  <Icon name="trash" className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              )}
              <span className="text-xs text-muted">{loading ? "Memuat..." : `${links.length} link`}</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">Slug</th>
                  <th className="px-5 py-3 font-semibold text-right">Klik</th>
                  <th className="px-5 py-3 font-semibold text-right">Link</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <div className="font-semibold font-mono text-xs text-emerald">{l.sub_id}</div>
                      <div className="text-xs text-muted truncate max-w-[200px]" title={l.destination_url}>{l.destination_url}</div>
                      {l.redirect_mode === "spinner" && (
                        <div className="text-[10px] text-amber-300 mt-0.5">spinner 2s</div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{l.slug}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(l.clicks)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setPreview(l)} className="p-1.5 rounded-lg text-muted hover:text-emerald hover:bg-emerald/10 transition-colors" title="Lihat">
                          <Icon name="eye" className="w-4 h-4" />
                        </button>
                        <CopyButton text={fullLink(l.slug, l.domain || defaultDomain)} />
                        <button onClick={() => confirmDeleteLink(l)} className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Hapus">
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && links.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted">
                      Belum ada link. Buat link pertama kamu di kolom sebelah kiri.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted">Memuat...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {ogPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOgPrompt(false)} />
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">OG Meta Belum Diisi</h3>
              <button onClick={() => setOgPrompt(false)} className="text-muted hover:text-foreground" aria-label="Tutup">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3.5 py-3 text-sm text-amber-300 mb-5">
              Mohon isi terlebih dahulu kolom <span className="font-semibold">OG Title</span>, <span className="font-semibold">OG Description</span>, dan <span className="font-semibold">OG Image URL</span> sebelum membuat link. Link tidak dibuat sampai semua field OG terisi.
            </div>
            <button onClick={() => setOgPrompt(false)} className="w-full py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors">
              Mengerti
            </button>
          </div>
        </div>
      )}

      {deleteOneTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteOneTarget(null)} />
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Hapus Link</h3>
              <button onClick={() => setDeleteOneTarget(null)} className="text-muted hover:text-foreground" aria-label="Tutup">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-sm text-red-300 mb-5">
              Kamu akan menghapus link <span className="font-mono font-semibold text-red-200">/{deleteOneTarget.slug}</span>. Tindakan ini tidak bisa dibatalkan. Yakin mau lanjut?
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteOneTarget(null)} className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors">
                Batal
              </button>
              <button onClick={deleteLink} disabled={busy} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60">
                {busy ? "Menghapus..." : "Hapus Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteAllPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteAllPrompt(false)} />
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Hapus Semua Link</h3>
              <button onClick={() => setDeleteAllPrompt(false)} className="text-muted hover:text-foreground" aria-label="Tutup">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-sm text-red-300 mb-5">
              Kamu akan menghapus <span className="font-bold">{links.length}</span> link sekaligus. Tindakan ini tidak bisa dibatalkan. Yakin mau lanjut?
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteAllPrompt(false)} className="flex-1 py-2.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-foreground transition-colors">
                Batal
              </button>
              <button onClick={deleteAll} disabled={busy} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60">
                {busy ? "Menghapus..." : "Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPreview(null)} />
          <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl p-6 animate-toast-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Link Siap Dipakai</h3>
              <button onClick={() => setPreview(null)} className="text-muted hover:text-foreground" aria-label="Tutup">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-navy border border-emerald/30 rounded-lg p-4 space-y-2.5">
              <Row label="Nama" value={preview.link_name} />
              <Row label="Sub ID" value={preview.sub_id} mono />
              <Row label="Mode Redirect" value={preview.redirect_mode === "spinner" ? "Spinner 2 detik" : "Langsung redirect"} />
              <div>
                <div className="text-xs text-muted mb-1">Destinasi (Smartlink admin)</div>
                <div className="text-xs text-muted break-all">{preview.destination_url}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Link</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-emerald break-all">{fullLink(preview.slug, preview.domain || defaultDomain)}</code>
                  <CopyButton text={fullLink(preview.slug, preview.domain || defaultDomain)} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-navy border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20";

function RedirectModeField({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Mode Redirect</label>
      <div className="flex rounded-lg border border-line overflow-hidden">
        <button
          type="button"
          onClick={() => onChange("direct")}
          className={`flex-1 py-2 px-3 text-xs font-bold transition-colors ${value === "direct" ? "bg-emerald text-navy" : "bg-surface-2 text-muted hover:text-foreground"}`}
        >
          Langsung Redirect
        </button>
        <button
          type="button"
          onClick={() => onChange("spinner")}
          className={`flex-1 py-2 px-3 text-xs font-bold transition-colors ${value === "spinner" ? "bg-emerald text-navy" : "bg-surface-2 text-muted hover:text-foreground"}`}
        >
          Spinner 2 detik
        </button>
      </div>
      {value === "spinner" && (
        <p className="text-[11px] text-amber-300 mt-1.5">
          Aman diposting di FB, IG, Threads &amp; aplikasi lain — redirect melewati spinner tipis 2 detik.
        </p>
      )}
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

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-sm font-bold ${mono ? "font-mono text-emerald" : ""}`}>{value}</span>
    </div>
  );
}

function DomainSelect({ value, onChange, domains }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-navy border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/20"
    >
      {domains.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}
