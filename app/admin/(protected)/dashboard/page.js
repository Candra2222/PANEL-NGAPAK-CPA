import { mockPanels, mockRedirects, mockConversions, formatNumber, formatCurrency } from "@/lib/mock-data";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { EarningsChart, TopBarChart } from "@/components/charts";
import { conversionChartByDay, topPerformanceBySubId } from "@/lib/mock-data";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function AdminDashboard() {
  const activePanels = mockPanels.filter((p) => p.is_active).length;
  const totalClicks = mockRedirects.reduce((s, r) => s + r.clicks, 0);
  const totalEarning = mockConversions.reduce((s, c) => s + c.earning, 0);
  const totalLinks = mockRedirects.length;
  const chartData = conversionChartByDay(14);
  const top = topPerformanceBySubId();

  const lastPanels = [...mockPanels]
    .sort((a, b) => new Date(b.last_login_at) - new Date(a.last_login_at))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard Admin"
        desc="Ringkasan performa seluruh sistem dan member."
        actions={
          <Link
            href="/admin/panels"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald text-navy text-sm font-bold hover:bg-emerald-dim transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Buat Sub ID
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="users" label="Sub ID Aktif" value={`${activePanels} / ${mockPanels.length}`} sub="Total member" tone="emerald" />
        <StatCard icon="link" label="Total Link" value={formatNumber(totalLinks)} sub="All Sub ID" tone="sky" />
        <StatCard icon="chart" label="Total Click" value={formatNumber(totalClicks)} sub="Gabungan semua link" tone="violet" />
        <StatCard icon="wallet" label="Total Earning" value={formatCurrency(totalEarning, "USD")} sub={`≈ ${formatCurrency(totalEarning, "IDR")}`} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3 bg-surface border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold">Earning & Conversion</h2>
              <p className="text-xs text-muted mt-0.5">14 hari terakhir</p>
            </div>
            <Badge tone="green" dot>Live</Badge>
          </div>
          <EarningsChart data={chartData} />
        </div>

        <div className="lg:col-span-2 bg-surface border border-line rounded-xl p-5">
          <h2 className="font-bold mb-4">Top Performa per Sub ID</h2>
          <TopBarChart data={top} money dataKey="earning" currency="USD" />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-bold">Aktivitas Terakhir Member</h2>
          <Link href="/admin/panels" className="text-xs font-semibold text-emerald hover:underline">
            Kelola semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Sub ID</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 font-semibold text-right">Link</th>
                <th className="px-5 py-3 font-semibold text-right">Klik</th>
              </tr>
            </thead>
            <tbody>
              {lastPanels.map((p) => {
                const links = mockRedirects.filter((r) => r.panel_id === p.id);
                const clicks = links.reduce((s, r) => s + r.clicks, 0);
                return (
                  <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
                    <td className="px-5 py-3 font-semibold">{p.panel_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-emerald">{p.sub_id}</td>
                    <td className="px-5 py-3">
                      <Badge tone={p.is_active ? "green" : "red"} dot>{p.is_active ? "Aktif" : "Nonaktif"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{new Date(p.last_login_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{links.length}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(clicks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
