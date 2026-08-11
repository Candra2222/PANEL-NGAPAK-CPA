import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Rate limiter berbasis DB (tabel rate_limits) supaya berfungsi
 * lintas instance serverless. Fail-open saat DB bermasalah.
 */
export async function checkRateLimit(key, limit, windowSeconds) {
  if (!key) return { ok: true };
  const supabase = supabaseAdmin();
  const now = new Date();
  try {
    const { data, error } = await supabase
      .from("rate_limits")
      .select("count, window_start")
      .eq("key", key)
      .maybeSingle();
    if (error) return { ok: true };

    if (!data) {
      const { error: insertErr } = await supabase
        .from("rate_limits")
        .insert({ key, count: 1, window_start: now.toISOString() });
      if (insertErr) return { ok: true };
      return { ok: true, remaining: limit - 1 };
    }

    const windowStart = new Date(now.getTime() - windowSeconds * 1000);
    if (new Date(data.window_start) < windowStart) {
      const { error: resetErr } = await supabase
        .from("rate_limits")
        .update({ count: 1, window_start: now.toISOString() })
        .eq("key", key);
      if (resetErr) return { ok: true };
      return { ok: true, remaining: limit - 1 };
    }

    if (data.count >= limit) {
      return {
        ok: false,
        retryAfter: Math.max(
          1,
          Math.ceil((new Date(data.window_start).getTime() + windowSeconds * 1000 - now.getTime()) / 1000)
        ),
      };
    }

    const { error: incErr } = await supabase
      .from("rate_limits")
      .update({ count: data.count + 1 })
      .eq("key", key);
    if (incErr) return { ok: true };
    return { ok: true, remaining: limit - data.count - 1 };
  } catch {
    return { ok: true };
  }
}

export function clientIp(request) {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
