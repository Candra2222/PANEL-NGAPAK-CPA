import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseAdmin";
import { hashPassword, isFastHash } from "./password";

function isValidStoredHash(hash) {
  if (typeof hash !== "string" || !hash) return false;
  if (isFastHash(hash)) return true;
  if (!/^\$2[aby]\$\d{2}\$/.test(hash)) return false;
  try {
    return Number.isFinite(bcrypt.getRounds(hash));
  } catch {
    return false;
  }
}

async function ensureCredential(table, envVar) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from(table).select("id, password_hash").limit(1);
  if (error) throw error;

  const row = data && data[0];
  if (row && isValidStoredHash(row.password_hash)) return true;

  const initial = process.env[envVar];
  if (!initial) return false;

  const passwordHash = await hashPassword(initial);
  if (row) {
    const { error: updateError } = await supabase
      .from(table)
      .update({ password_hash: passwordHash })
      .eq("id", row.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from(table)
      .insert({ password_hash: passwordHash });
    if (insertError) throw insertError;
  }
  return true;
}

export function ensureAdminAccess() {
  return ensureCredential("admin_access", "INITIAL_ADMIN_PASSWORD");
}

export function ensureMonitorAccess() {
  return ensureCredential("monitor_access", "INITIAL_MONITOR_PASSWORD");
}
