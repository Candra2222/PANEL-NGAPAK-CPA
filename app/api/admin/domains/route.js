import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getZoneId, addCustomDomain, addRoute, listCustomDomains, listRoutes } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const supabase = supabaseAdmin();
  const { data, error: dbErr } = await supabase
    .from("domains")
    .select("*")
    .order("added_at", { ascending: false });
  if (dbErr) return error("Gagal memuat domain.", 500);

  return json({ domains: data || [] });
}

export async function POST(request) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").trim().toLowerCase();
  if (!name || !name.includes(".")) {
    return error("Nama domain tidak valid.", 400);
  }

  const supabase = supabaseAdmin();

  const { data: exists } = await supabase.from("domains").select("id").eq("name", name).maybeSingle();
  if (exists) return error("Domain sudah terdaftar.", 409);

  let zoneId, cfDomainId, cfRouteId;
  try {
    zoneId = await getZoneId(name);
    const domainResult = await addCustomDomain(name, zoneId);
    cfDomainId = domainResult.cf_domain_id;
    zoneId = domainResult.zone_id;
    const routeResult = await addRoute(name, zoneId);
    cfRouteId = routeResult.cf_route_id;
  } catch (cfErr) {
    return error(`Cloudflare API error: ${cfErr.message}`, 502);
  }

  const { data: domain, error: insertErr } = await supabase
    .from("domains")
    .insert({
      name,
      zone_id: zoneId,
      cf_domain_id: cfDomainId,
      cf_route_id: cfRouteId,
      is_active: true,
      dns_status: "verified",
    })
    .select()
    .single();
  if (insertErr) return error("Gagal menyimpan domain.", 500);

  return json({ ok: true, domain });
}
