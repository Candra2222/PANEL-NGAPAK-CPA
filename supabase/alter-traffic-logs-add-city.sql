-- Migration: tambah kolom lokasi (provinsi, kota/kabupaten, kode pos) di traffic_logs
-- Jalankan di Supabase Dashboard -> SQL Editor -> paste & Run.
alter table public.traffic_logs
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists postal_code text;
