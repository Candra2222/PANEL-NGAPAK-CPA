import { encryptPassword } from "./encrypt";

export const DEMO_HINT = "Gunakan password apa saja (misal: demo)";

const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600 * 1000);
const daysAgo = (d) => new Date(now - d * 86400 * 1000);

export const mockDomains = [
  {
    id: "d1",
    name: "go.panel-cpa.id",
    zone: "panel-cpa.id",
    is_active: true,
    dns_status: "verified",
    record_type: "A",
    target: "76.76.21.21",
    proxied: true,
    ttl: "Auto",
    added_at: daysAgo(45),
  },
  {
    id: "d2",
    name: "lnk.panelcpa.co",
    zone: "panelcpa.co",
    is_active: true,
    dns_status: "verified",
    record_type: "CNAME",
    target: "redirect.panel-cpa.id",
    proxied: true,
    ttl: "Auto",
    added_at: daysAgo(20),
  },
  {
    id: "d3",
    name: "go.panelcpa.xyz",
    zone: "panelcpa.xyz",
    is_active: false,
    dns_status: "pending",
    record_type: "A",
    target: "",
    proxied: false,
    ttl: "Auto",
    added_at: daysAgo(5),
  },
];

export const DEFAULT_DOMAIN = (mockDomains.find((d) => d.is_active) || mockDomains[0]).name;

export const REDIRECT_BASE = `https://${DEFAULT_DOMAIN}`;

export const mockPanels = [
  {
    id: "p1",
    sub_id: "trafee_001",
    panel_name: "Tim Alpha",
    smartlink_url: "https://smartlink.trafee.com/click?pub=999&sub_id=trafee_001&c=summer",
    password_enc: encryptPassword("trafee_001"),
    is_active: true,
    created_at: daysAgo(42),
    last_login_at: hoursAgo(2),
  },
  {
    id: "p2",
    sub_id: "trafee_002",
    panel_name: "Team Bravo",
    smartlink_url: "https://smartlink.trafee.com/click?pub=999&sub_id=trafee_002&c=summer",
    password_enc: encryptPassword("trafee_002"),
    is_active: true,
    created_at: daysAgo(35),
    last_login_at: hoursAgo(9),
  },
  {
    id: "p3",
    sub_id: "trafee_003",
    panel_name: "Grup Charlie",
    smartlink_url: "https://smartlink.trafee.com/click?pub=999&sub_id=trafee_003&c=summer",
    password_enc: encryptPassword("trafee_003"),
    is_active: true,
    created_at: daysAgo(21),
    last_login_at: hoursAgo(26),
  },
  {
    id: "p4",
    sub_id: "trafee_004",
    panel_name: "Tim Delta",
    smartlink_url: "https://smartlink.trafee.com/click?pub=999&sub_id=trafee_004&c=summer",
    password_enc: encryptPassword("trafee_004"),
    is_active: false,
    created_at: daysAgo(14),
    last_login_at: daysAgo(5),
  },
  {
    id: "p5",
    sub_id: "trafee_005",
    panel_name: "Squad Echo",
    smartlink_url: "https://smartlink.trafee.com/click?pub=999&sub_id=trafee_005&c=summer",
    password_enc: encryptPassword("trafee_005"),
    is_active: true,
    created_at: daysAgo(3),
    last_login_at: hoursAgo(1),
  },
];

export const mockRedirects = [
  {
    id: "r1",
    panel_id: "p1",
    sub_id: "trafee_001",
    slug: "penawaran-agustus",
    destination_url: "https://trafee.com/offers/best-deal",
    link_name: "Promo Agustus",
    og_title: "Promo Agustus — Diskon s.d. 50%",
    og_description: "Penawaran terbaik bulan ini dari Trafee.",
    og_image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
    clicks: 1284,
    created_at: daysAgo(40),
  },
  {
    id: "r2",
    panel_id: "p1",
    sub_id: "trafee_001",
    slug: "cashback-eps1",
    destination_url: "https://trafee.com/offers/cashback",
    link_name: "Cashback Edisi 1",
    og_title: "Cashback hingga 20%",
    og_description: "Cashback eksklusif untuk member baru.",
    og_image: null,
    clicks: 862,
    created_at: daysAgo(30),
  },
  {
    id: "r3",
    panel_id: "p2",
    sub_id: "trafee_002",
    slug: "spesial-bravo",
    destination_url: "https://trafee.com/offers/bravo-pack",
    link_name: "Bravo Special",
    og_title: "Bravo Pack Special",
    og_description: "Paket spesial khusus Team Bravo.",
    og_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    clicks: 2140,
    created_at: daysAgo(28),
  },
  {
    id: "r4",
    panel_id: "p2",
    sub_id: "trafee_002",
    slug: "voucher-mingguan",
    destination_url: "https://trafee.com/offers/voucher-weekly",
    link_name: "Voucher Mingguan",
    og_title: "Voucher Mingguan",
    og_description: "Kumpulkan voucher mingguan mu.",
    og_image: null,
    clicks: 509,
    created_at: daysAgo(18),
  },
  {
    id: "r5",
    panel_id: "p3",
    sub_id: "trafee_003",
    slug: "charlie-launch",
    destination_url: "https://trafee.com/offers/charlie-launch",
    link_name: "Launch Charlie",
    og_title: "Launch Perdana Charlie",
    og_description: "Rilis besar pertama Grup Charlie.",
    og_image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800",
    clicks: 3311,
    created_at: daysAgo(15),
  },
  {
    id: "r6",
    panel_id: "p3",
    sub_id: "trafee_003",
    slug: "bundling-ramadhan",
    destination_url: "https://trafee.com/offers/bundling",
    link_name: "Bundling Ramadhan",
    og_title: "Bundling Spesial Ramadhan",
    og_description: "Bundling hemat selama Ramadhan.",
    og_image: null,
    clicks: 1870,
    created_at: daysAgo(12),
  },
  {
    id: "r7",
    panel_id: "p4",
    sub_id: "trafee_004",
    slug: "delta-old-camp",
    destination_url: "https://trafee.com/offers/delta",
    link_name: "Old Camp Delta",
    og_title: "Campaign Delta",
    og_description: "Campaign lama tim Delta.",
    og_image: null,
    clicks: 314,
    created_at: daysAgo(13),
  },
  {
    id: "r8",
    panel_id: "p5",
    sub_id: "trafee_005",
    slug: "echo-intro",
    destination_url: "https://trafee.com/offers/echo-intro",
    link_name: "Echo Intro",
    og_title: "Welcome Echo Squad",
    og_description: "Kampanye perkenalan Squad Echo.",
    og_image: null,
    clicks: 96,
    created_at: daysAgo(2),
  },
];

const COUNTRIES = ["ID", "MY", "SG", "TH", "PH", "VN", "US", "GB", "SA", "AU"];
const BROWSERS = ["Chrome", "Safari", "Edge", "Firefox", "Opera", "Samsung Internet"];
const DEVICES = ["Android", "iPhone", "Desktop Windows", "macOS", "iPad", "Desktop Linux"];
const APPS = ["Facebook", "Instagram", "Threads", "X", "TikTok", "WhatsApp", "Telegram", "YouTube", "Messenger", "LINE"];
export const mockApps = APPS;

function seedTraffic(count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const r = mockRedirects[Math.floor(Math.random() * mockRedirects.length)];
    rows.push({
      id: `t${i}`,
      redirect_id: r.id,
      panel_id: r.panel_id,
      sub_id: r.sub_id,
      ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      browser_app: BROWSERS[Math.floor(Math.random() * BROWSERS.length)],
      os_device: DEVICES[Math.floor(Math.random() * DEVICES.length)],
      app: APPS[Math.floor(Math.random() * APPS.length)],
      created_at: hoursAgo(Math.floor(Math.random() * 48)),
    });
  }
  return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function seedConversions(count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const r = mockRedirects[Math.floor(Math.random() * mockRedirects.length)];
    const amount = (Math.random() * 8 + 0.5).toFixed(2);
    rows.push({
      id: `c${i}`,
      redirect_id: r.id,
      panel_id: r.panel_id,
      sub_id: r.sub_id,
      network_name: "Trafee",
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      earning: parseFloat(amount),
      ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      browser_app: BROWSERS[Math.floor(Math.random() * BROWSERS.length)],
      os_device: DEVICES[Math.floor(Math.random() * DEVICES.length)],
      app: APPS[Math.floor(Math.random() * APPS.length)],
      created_at: hoursAgo(Math.floor(Math.random() * 48)),
    });
  }
  return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export const mockTraffic = seedTraffic(140);
export const mockConversions = seedConversions(34);

export const conversionChartByDay = (days = 14) => {
  const out = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = daysAgo(d);
    const label = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    out.push({
      day: label,
      klik: 90 + Math.floor(Math.random() * 260),
      conversion: 6 + Math.floor(Math.random() * 26),
      earning: parseFloat((30 + Math.random() * 120).toFixed(2)),
    });
  }
  return out;
};

export const hourlyTrafficToday = () => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    out.push({
      jam: `${String(h).padStart(2, "0")}:00`,
      traffic: 2 + Math.floor(Math.random() * 60),
    });
  }
  return out;
};

export const topPerformanceBySubId = () => {
  const map = new Map();
  mockConversions.forEach((c) => {
    const cur = map.get(c.sub_id) || { sub_id: c.sub_id, conversions: 0, earning: 0, clicks: 0 };
    cur.conversions += 1;
    cur.earning += c.earning;
    map.set(c.sub_id, cur);
  });
  mockRedirects.forEach((r) => {
    const cur = map.get(r.sub_id);
    if (cur) cur.clicks += r.clicks;
    else map.set(r.sub_id, { sub_id: r.sub_id, conversions: 0, earning: 0, clicks: r.clicks });
  });
  return [...map.values()]
    .map((v) => ({ ...v, earning: parseFloat(v.earning.toFixed(2)) }))
    .sort((a, b) => b.earning - a.earning);
};

export const startOfConversionDay = () => {
  const wib = new Date(Date.now() + 7 * 3600 * 1000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3600 * 1000).getTime();
};

export const topPerformanceToday = () => {
  const start = startOfConversionDay();
  const end = start + 86400000;
  const map = new Map();
  mockConversions
    .filter((c) => {
      const ts = new Date(c.created_at).getTime();
      return ts >= start && ts < end;
    })
    .forEach((c) => {
      const cur = map.get(c.sub_id) || { sub_id: c.sub_id, conversions: 0, earning: 0 };
      cur.conversions += 1;
      cur.earning += c.earning;
      map.set(c.sub_id, cur);
    });
  return [...map.values()]
    .map((v) => ({ ...v, earning: parseFloat(v.earning.toFixed(2)) }))
    .sort((a, b) => b.earning - a.earning)
    .slice(0, 10);
};

export const topCountries = () => {
  const map = new Map();
  mockTraffic.forEach((t) => map.set(t.country, (map.get(t.country) || 0) + 1));
  mockConversions.forEach((c) => map.set(c.country, (map.get(c.country) || 0) + 1));
  return [...map.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

function seededRand(seed) {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const dailyReport = (dateStr) => {
  const base = new Date(dateStr + "T00:00:00").getTime();
  return mockPanels.map((p) => {
    let hash = 0;
    for (let i = 0; i < p.sub_id.length; i++) hash = (hash * 31 + p.sub_id.charCodeAt(i)) | 0;
    const rand = seededRand(base ^ hash);
    const clicks = 20 + Math.floor(rand() * 480);
    const conversions = Math.min(clicks, Math.floor(rand() * (clicks * 0.12)) + 1);
    const earning = conversions * parseFloat((0.5 + rand() * 6).toFixed(2));
    return {
      sub_id: p.sub_id,
      network_name: "Trafee",
      country: COUNTRIES[Math.floor(rand() * COUNTRIES.length)],
      clicks,
      conversions,
      earning: parseFloat(earning.toFixed(2)),
    };
  }).sort((a, b) => b.earning - a.earning);
};

export const dailyReportRange = (startDate, endDate) => {
  const map = new Map();
  const cur = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (end < cur) return [];
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10);
    dailyReport(iso).forEach((r) => {
      const item = map.get(r.sub_id) || {
        sub_id: r.sub_id,
        network_name: r.network_name,
        country: r.country,
        clicks: 0,
        conversions: 0,
        earning: 0,
      };
      item.clicks += r.clicks;
      item.conversions += r.conversions;
      item.earning += r.earning;
      map.set(r.sub_id, item);
    });
    cur.setDate(cur.getDate() + 1);
  }
  return [...map.values()]
    .map((v) => ({ ...v, earning: parseFloat(v.earning.toFixed(2)) }))
    .sort((a, b) => b.earning - a.earning);
};

export const panelStats = (panelId) => {
  const links = mockRedirects.filter((r) => r.panel_id === panelId);
  const clicks = links.reduce((s, r) => s + r.clicks, 0);
  const convs = mockConversions.filter((c) => c.panel_id === panelId);
  const earning = convs.reduce((s, c) => s + c.earning, 0);
  return {
    links: links.length,
    clicks,
    conversions: convs.length,
    earning: parseFloat(earning.toFixed(2)),
    ctr: clicks > 0 ? parseFloat(((convs.length / clicks) * 100).toFixed(2)) : 0,
  };
};

export function panelById(id) {
  return mockPanels.find((p) => p.id === id);
}

const SUB_ID_PARAM_KEYS = [
  "sub_id", "subid", "sub", "sub1", "sub2", "s1", "s2", "sid",
  "aff_sub", "aff_sub1", "aff_sub2", "af_sub", "af_sub1",
  "clickid", "click_id", "ext_click_id", "traffic_source",
  "subsource", "sub_source", "track", "track_id", "trk",
  "cid", "adv_sub", "publisher_id", "pid", "utm_source", "utm_content",
];

export function detectSubIdParams(url) {
  if (!url) return [];
  try {
    const u = new URL(url.trim());
    const found = [];
    for (const key of SUB_ID_PARAM_KEYS) {
      const val = u.searchParams.get(key);
      if (val && val.trim()) found.push({ key, value: val.trim() });
    }
    if (found.length === 0) {
      for (const [key, val] of u.searchParams) {
        if (val && val.trim()) found.push({ key, value: val.trim() });
      }
    }
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length) found.push({ key: "path", value: decodeURIComponent(segments[segments.length - 1]) });
    return found;
  } catch {
    return [];
  }
}

export function extractSubIdFromUrl(url) {
  const params = detectSubIdParams(url);
  return params.length ? params[0].value : null;
}

export function isValidUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatNumber(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export const USD_TO_IDR = 16200;

export function formatCurrency(value, currency = "USD") {
  if (currency === "IDR") {
    return "Rp " + formatNumber(Math.round(value * USD_TO_IDR));
  }
  return "$" + value.toFixed(2);
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function dateTime(date) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function randomSlug(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function fullLink(slug, domain = DEFAULT_DOMAIN) {
  return `https://${domain}/${slug}`;
}
