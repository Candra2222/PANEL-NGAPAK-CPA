-- ============================================================
-- SEED — password awal Panel 1 (Admin) & Panel 3 (Monitor)
--
-- OPSIONAL. Aplikasi otomatis me-seed + self-heal dari env
-- (INITIAL_ADMIN_PASSWORD / INITIAL_MONITOR_PASSWORD) di
-- lib/bootstrap.js pada setiap percobaan login:
--   - tabel kosong        -> insert hash(env password)
--   - hash lama invalid   -> overwrite hash(env password)
--
-- File ini hanya alternatif seed manual yang deterministik:
-- 1) Generate bcrypt hash:
--      node supabase/hash-password.mjs "password-admin-kamu"
--      node supabase/hash-password.mjs "password-monitor-kamu"
-- 2) Ganti <HASH_ADMIN> / <HASH_MONITOR> dengan hasil hash.
--
-- CATATAN: baris insert hanya berjalan jika nilai pengganti
-- adalah hash bcrypt yang valid (regex ^$2[aby]$NN$). Jika
-- dibiarkan sebagai placeholder, seed ini jadi no-op.
-- ============================================================

insert into public.admin_access (password_hash)
select '<HASH_ADMIN>'
where '<HASH_ADMIN>' ~ '^\$2[aby]\$\d{2}\$'
on conflict (singleton) do update set password_hash = excluded.password_hash;

insert into public.monitor_access (password_hash)
select '<HASH_MONITOR>'
where '<HASH_MONITOR>' ~ '^\$2[aby]\$\d{2}\$'
on conflict (singleton) do update set password_hash = excluded.password_hash;
