import { error, json, requireSession } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(_request, { params }) {
  const { session } = await requireSession("panel");
  if (!session) return error("Unauthorized.", 401);

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: redirect, error: loadError } = await supabase
    .from("redirects")
    .select("id, panel_id, slug")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return error("Gagal memuat link.", 500, { detail: loadError.message });
  if (!redirect) return error("Link tidak ditemukan.", 404);
  if (redirect.panel_id !== session.panel_id) return error("Anda tidak berhak menghapus link ini.", 403);

  const { error: deleteError } = await supabase.from("redirects").delete().eq("id", id);
  if (deleteError) return error("Gagal menghapus link.", 500, { detail: deleteError.message });

  return json({ ok: true });
}
