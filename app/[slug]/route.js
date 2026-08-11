import { NextResponse } from "next/server";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BOT_RE =
  /(bot|crawler|spider|preview|facebookexternalhit|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebot|ia_archiver|twitterbot|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|pinterest|pinterestbot|tumblr|linkedinbot|vkshare|applebot|bytespider|semrushbot|ahrefsbot|google-inspectiontool|tiktok|instagram|meta-externalagent|redditbot|embeds)/i;

function isBot(ua) {
  return BOT_RE.test(ua || "");
}

function detectBrowser(ua) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/opr\//i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
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
  };
}

function ogHtml(redirect) {
  const title = redirect.og_title || redirect.link_name || "Lihat Penawaran";
  const desc = redirect.og_description || "";
  const image = redirect.og_image || "";
  const url = redirect.destination_url || "";
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
${desc ? `<meta property="og:description" content="${escapeHtml(desc)}" />` : ""}
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
<meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
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
<meta http-equiv="refresh" content="0.2;url=${escapeHtml(url)}" />
<title>Mengalihkan...</title>
<style>
  body{background:#0d1117;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif}
  .spinner{width:38px;height:38px;border:3px solid #21262d;border-top-color:#10b981;border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  <div class="spinner"></div>
  <script>setTimeout(function(){window.location.replace(${JSON.stringify(url)});},200);</script>
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

  if (isBot(ua)) {
    return new Response(ogHtml(redirect), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const info = clientInfo(request);
  after(async () => {
    try {
      await supabase.from("traffic_logs").insert({
        redirect_id: redirect.id,
        panel_id: redirect.panel_id,
        sub_id: redirect.sub_id,
        ip_address: info.ip,
        country: info.country,
        browser_app: info.browser,
        os_device: info.os,
      });
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
