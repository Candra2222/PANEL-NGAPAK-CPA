#!/usr/bin/env node
/**
 * Migrasi hash password bcrypt -> sha256 (format cepat) di Supabase.
 * JALANKAN LOKAL (bukan di Worker Cloudflare). bcrypt dijalankan di lokal
 * sehingga bebas dari limit CPU 10ms Cloudflare.
 *
 * Cara pakai:
 *   SUPABASE_URL="https://xxx.supabase.co" SUPABASE_SERVICE_ROLE_KEY="..." \
 *     node scripts/migrate-hashes.mjs \
 *       --admin-pw "password-admin" \
 *       --monitor-pw "password-monitor" \
 *       --panel-pw "password-member"
 *
 *   atau baca secret dari file (baris KEY=value):
 *   node scripts/migrate-hashes.mjs --env-file .env.migrate --admin-pw ...
 *
 * Mode "set ulang" (tanpa password lama): password tiap panel dijadikan
 * sama dengan sub_id-nya.
 *   node scripts/migrate-hashes.mjs --env-file .env.migrate --panel-pw-mode subid
 *
 * Catatan: verifikasi bcrypt dilakukan lokal; bila password tidak cocok
 * dengan hash, baris TIDAK diubah. Panel dengan password berbeda dari
 * --panel-pw tetap bcrypt dan harus di-reset lewat admin UI.
 */
import { readFileSync, existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { hashPassword, isFastHash } from "../lib/password.js";

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

const envFile = getArg("--env-file");
if (envFile && existsSync(envFile)) {
  const txt = readFileSync(envFile, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      const name = m[1];
      const value = m[2].trim().replace(/^["']|["']$/g, "");
      if (name === "NEXT_PUBLIC_SUPABASE_URL" && !url) url = value;
      if (name === "SUPABASE_SERVICE_ROLE_KEY" && !key) key = value;
    }
  }
}

if (!url || !key) {
  console.error("Butuh SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY (env/arg atau --env-file).");
  process.exit(1);
}

const adminPw = getArg("--admin-pw");
const monitorPw = getArg("--monitor-pw");
const panelPw = getArg("--panel-pw");
const panelPwMode = getArg("--panel-pw-mode");

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

function isBcrypt(h) {
  return typeof h === "string" && /^\$2[aby]\$\d{2}\$/.test(h);
}

async function migrateSingle(table, label, password) {
  if (!password) {
    console.log(`- ${label}: dilewati (password kosong)`);
    return;
  }
  const { data, error } = await supabase.from(table).select("id, password_hash").limit(1);
  if (error) {
    console.log(`- ${label}: gagal ambil row: ${error.message}`);
    return;
  }
  const row = data && data[0];
  if (!row) {
    console.log(`- ${label}: tidak ada row`);
    return;
  }
  if (isFastHash(row.password_hash)) {
    console.log(`- ${label}: sudah sha256, dilewati`);
    return;
  }
  if (isBcrypt(row.password_hash)) {
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      console.log(`- ${label}: password TIDAK cocok dengan hash bcrypt (tidak dimigrasi)`);
      return;
    }
    const newHash = await hashPassword(password);
    const { error: ue } = await supabase.from(table).update({ password_hash: newHash }).eq("id", row.id);
    if (ue) console.log(`- ${label}: GAGAL update: ${ue.message}`);
    else console.log(`- ${label}: dimigrasi OK`);
  } else {
    console.log(`- ${label}: format hash tak dikenal, tidak dimigrasi`);
  }
}

async function migratePanels(password) {
  if (!password) {
    console.log("- panels: dilewati (password kosong)");
    return;
  }
  const { data, error } = await supabase.from("panels").select("id, sub_id, password_hash").order("sub_id");
  if (error) {
    console.log(`- panels: gagal ambil: ${error.message}`);
    return;
  }
  let migrated = 0;
  let skipped = 0;
  let mismatch = 0;
  for (const p of data || []) {
    if (isFastHash(p.password_hash)) {
      skipped++;
      continue;
    }
    if (!isBcrypt(p.password_hash)) {
      mismatch++;
      continue;
    }
    const ok = await bcrypt.compare(password, p.password_hash);
    if (!ok) {
      mismatch++;
      console.log(`  - ${p.sub_id}: password TIDAK cocok (tetap bcrypt)`);
      continue;
    }
    const newHash = await hashPassword(password);
    const { error: ue } = await supabase.from("panels").update({ password_hash: newHash }).eq("id", p.id);
    if (ue) {
      mismatch++;
      console.log(`  - ${p.sub_id}: GAGAL update: ${ue.message}`);
      continue;
    }
    migrated++;
  }
  console.log(`- panels: selesai (dimigrasi=${migrated}, sudah-sha256=${skipped}, gagal/tak-cocok=${mismatch})`);
}

async function migratePanelsToSubId() {
  const { data, error } = await supabase.from("panels").select("id, sub_id, password_hash").order("sub_id");
  if (error) {
    console.log(`- panels: gagal ambil: ${error.message}`);
    return;
  }
  let updated = 0;
  let skipped = 0;
  for (const p of data || []) {
    const pw = String(p.sub_id || "");
    if (!pw) {
      skipped++;
      console.log(`  - (id=${p.id}): sub_id kosong, dilewati`);
      continue;
    }
    const newHash = await hashPassword(pw);
    if (isFastHash(p.password_hash) && p.password_hash === newHash) {
      skipped++;
      continue;
    }
    const { error: ue } = await supabase.from("panels").update({ password_hash: newHash }).eq("id", p.id);
    if (ue) {
      console.log(`  - ${p.sub_id}: GAGAL update: ${ue.message}`);
      continue;
    }
    updated++;
    console.log(`  - ${p.sub_id}: password diset = sub_id`);
  }
  console.log(`- panels: selesai (diset=${updated}, sudah-cocok=${skipped})`);
}

console.log("Migrasi hash bcrypt -> sha256 dimulai...");
if (panelPwMode === "subid") {
  await migratePanelsToSubId();
} else {
  await migrateSingle("admin_access", "admin", adminPw);
  await migrateSingle("monitor_access", "monitor", monitorPw);
  await migratePanels(panelPw);
}
console.log("Selesai.");
