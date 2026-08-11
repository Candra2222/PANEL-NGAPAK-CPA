import { supabaseAdmin } from "./supabaseAdmin";
import { hashPassword } from "./password";

async function ensureCredential(table, envVar) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from(table).select("id").limit(1);
  if (error) throw error;
  if (data && data.length > 0) return true;
  const initial = process.env[envVar];
  if (!initial) return false;
  const { error: insertError } = await supabase
    .from(table)
    .insert({ password_hash: await hashPassword(initial) });
  if (insertError) throw insertError;
  return true;
}

export function ensureAdminAccess() {
  return ensureCredential("admin_access", "INITIAL_ADMIN_PASSWORD");
}

export function ensureMonitorAccess() {
  return ensureCredential("monitor_access", "INITIAL_MONITOR_PASSWORD");
}
