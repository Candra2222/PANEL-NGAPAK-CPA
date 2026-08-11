-- ============================================================
-- SEED — password awal Panel 1 (Admin) & Panel 3 (Monitor)
--
-- Cara pakai OPSIONAL: aplikasi juga otomatis me-seed dari env
-- (INITIAL_ADMIN_PASSWORD / INITIAL_MONITOR_PASSWORD) saat pertama
-- kali tabel kosong. File ini untuk alternatif seed manual.
--
-- 1) Generate bcrypt hash:
--      node supabase/hash-password.mjs "password-admin-kamu"
--      node supabase/hash-password.mjs "password-monitor-kamu"
-- 2) Ganti <HASH_ADMIN> / <HASH_MONITOR> lalu jalankan di SQL Editor.
-- ============================================================

insert into public.admin_access (password_hash)
values ('<HASH_ADMIN>')
on conflict (singleton) do update set password_hash = excluded.password_hash;

insert into public.monitor_access (password_hash)
values ('<HASH_MONITOR>')
on conflict (singleton) do update set password_hash = excluded.password_hash;
