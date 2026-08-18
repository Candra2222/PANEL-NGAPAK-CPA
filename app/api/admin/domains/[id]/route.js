import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { removeCustomDomain, removeRoute } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = supabaseAdmin();

  const { data: domain, error: findErr } = await supabase
    .from("domains")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (findErr || !domain) return error("Domain tidak ditemukan.", 404);

  const updates = {};
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  if (!Object.keys(updates).length) return error("Tidak ada yang diupdate.", 400);

  const { data: updated, error: updateErr } = await supabase
    .from("domains")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (updateErr) return error("Gagal update domain.", 500);

  return json({ ok: true, domain: updated });
}

export async function DELETE(request, { params }) {
  const { session } = await requireSession("admin");
  if (!session) return error("Unauthorized.", 401);

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: domain, error: findErr } = await supabase
    .from("domains")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (findErr || !domain) return error("Domain tidak ditemukan.", 404);

  const errors = [];
  if (domain.cf_domain_id) {
    try { await removeCustomDomain(domain.cf_domain_id); } catch (e) { errors.push(e.message); }
  }
  if (domain.cf_route_id) {
    try { await removeRoute(domain.cf_route_id); } catch (e) { errors.push(e.message); }
  }

  const { error: delErr } = await supabase.from("domains").delete().eq("id", id);
  if (delErr) return error("Gagal hapus domain dari database.", 500);

  return json({ ok: true, cloudflare_errors: errors.length ? errors : undefined });
}
