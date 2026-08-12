import { NextResponse } from "next/server";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BOT_RE =
  /(bot|crawler|spider|preview|facebookexternalhit|facebookcatalog|meta-externalagent|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebot|ia_archiver|twitterbot|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|pinterest|pinterestbot|tumblr|linkedinbot|vkshare|applebot|bytespider|semrushbot|ahrefsbot|google-inspectiontool|tiktok|instagram|threads|redditbot|outbrain|pocket|embeds)/i;

// Unambiguous social crawler user agents — mereka DIPAKSA untuk tidak
// mengikuti redirect (tanpa meta refresh) agar preview OG ter-scrape
// dari halaman kita, bukan dari smartlink tujuan.
const SOCIAL_BOT_RE =
  /(facebookexternalhit|facebookcatalog|meta-externalagent|facebot|twitterbot|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|pinterestbot|tumblr|linkedinbot|vkshare|snapbot|redditbot|outbrain|pocket|applebot|bytespider|ahrefsbot|semrushbot|googlebot|bingbot|slurp|yandex|embeds)/i;

function isBot(ua) {
  return BOT_RE.test(ua || "");
}

function isSocialBot(ua) {
  return SOCIAL_BOT_RE.test(ua || "");
}

function detectBrowser(ua) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/opr\//i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return null;
}

function detectApp(ua) {
  if (/fbav|fban|facebookexternalhit|facebook/i.test(ua)) return "Facebook";
  if (/instagram/i.test(ua)) return "Instagram";
  if (/threads/i.test(ua)) return "Threads";
  if (/tiktok|musical_ly/i.test(ua)) return "TikTok";
  if (/whatsapp/i.test(ua)) return "WhatsApp";
  if (/telegram|android.*tg/i.test(ua)) return "Telegram";
  if (/youtube|com\.google\.android\.youtube/i.test(ua)) return "YouTube";
  if (/messenger/i.test(ua)) return "Messenger";
  if (/line\//i.test(ua)) return "LINE";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/twitter|tweetdeck/i.test(ua)) return "X";
  return null;
}

function detectOS(ua) {
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return null;
}

function clientInfo(request) {
  const ua = request.headers.get("user-agent") || "";
  return {
    ip:
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    country:
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null,
    browser: detectBrowser(ua),
    os: detectOS(ua),
    app: detectApp(ua),
  };
}

const cityCache = new Map();

async function resolveCity(ip, headers) {
  if (!ip) return null;
  if (cityCache.has(ip)) return cityCache.get(ip);

  let loc = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,regionName,city,zip`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const d = await res.json();
      if (d && d.status === "success") {
        loc = {
          region: d.regionName || null,
          city: d.city || null,
          postal_code: d.zip || null,
        };
      }
    }
  } catch {}

  if (!loc) {
    const headerCity = headers.get("cf-ipcity") || headers.get("x-vercel-ip-city");
    if (headerCity && headerCity.trim()) {
      loc = { region: null, city: headerCity.trim(), postal_code: null };
    }
  }

  cityCache.set(ip, loc);
  return loc;
}

function absoluteImageUrl(value, requestUrl) {
  const v = (value || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  let origin = "";
  try {
    origin = new URL(requestUrl).origin;
  } catch {}
  if (v.startsWith("//")) return `${origin ? origin.replace(/^http:/, "https:") : "https:"}${v}`;
  if (v.startsWith("/") && origin) return origin + v;
  return v;
}

function ogHtml(redirect, requestUrl, autoRedirect) {
  const title = redirect.og_title || redirect.link_name || "Lihat Penawaran";
  const desc = redirect.og_description || "";
  const image = absoluteImageUrl(redirect.og_image, requestUrl);
  const url = redirect.destination_url || "";
  const refresh = autoRedirect ? `<meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />` : "";
  const twitterCard = image ? "summary_large_image" : "summary";
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(requestUrl || "")}" />
${desc ? `<meta property="og:description" content="${escapeHtml(desc)}" />` : ""}
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:locale" content="id_ID" />
<meta property="og:site_name" content="CPA Link Panel" />
<meta name="twitter:card" content="${twitterCard}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
${desc ? `<meta name="twitter:description" content="${escapeHtml(desc)}" />` : ""}
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
${refresh}
</head>
<body style="background:#0d1117;color:#8b949e;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <a href="${escapeHtml(url)}" style="color:#10b981">Membuka...</a>
</body>
</html>`;
}

function spinnerHtml(redirect) {
  const url = redirect.destination_url || "";
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<meta http-equiv="refresh" content="2;url=${escapeHtml(url)}" />
<title>Mengalihkan...</title>
<style>
  body{background:#0d1117;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif}
  .spinner{width:38px;height:38px;border:3px solid #21262d;border-top-color:#10b981;border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  <div class="spinner"></div>
  <script>setTimeout(function(){window.location.replace(${JSON.stringify(url)});},2000);</script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request, { params }) {
  const { slug } = await params;
  const supabase = supabaseAdmin();

  const { data: redirect, error } = await supabase
    .from("redirects")
    .select("id, panel_id, sub_id, destination_url, link_name, og_title, og_description, og_image, redirect_mode")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !redirect) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ua = request.headers.get("user-agent") || "";

  if (isBot(ua) || isSocialBot(ua)) {
    // Crawler sosial (FB/IG/Threads/Twitter/WA/Telegram/dll) disajikan
    // halaman preview TANPA auto-redirect agar preview gambar/title/deskripsi
    // muncul. UA seperti in-app browser IG/TikTok tetap mendapat redirect.
    return new Response(ogHtml(redirect, request.url, !isSocialBot(ua)), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const info = clientInfo(request);
  after(async () => {
    try {
      const loc = await resolveCity(info.ip, request.headers);
      const row = {
        redirect_id: redirect.id,
        panel_id: redirect.panel_id,
        sub_id: redirect.sub_id,
        ip_address: info.ip,
        country: info.country,
        region: loc ? loc.region : null,
        city: loc ? loc.city : null,
        postal_code: loc ? loc.postal_code : null,
        browser_app: info.browser,
        os_device: info.os,
        app: info.app,
      };
      let { error: insertError } = await supabase.from("traffic_logs").insert(row);
      if (insertError) {
        const fallback = { ...row };
        delete fallback.region;
        delete fallback.city;
        delete fallback.postal_code;
        await supabase.from("traffic_logs").insert(fallback);
      }
    } catch {}
  });

  const destination = redirect.destination_url;

  if (redirect.redirect_mode === "spinner") {
    return new Response(spinnerHtml(redirect), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return NextResponse.redirect(destination, { status: 302 });
}
