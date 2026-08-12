-- Migration: tambah kolom app (in-app browser: Facebook, Instagram, WhatsApp, Telegram, dll)
-- di traffic_logs dan conversions.
-- Jalankan di Supabase Dashboard -> SQL Editor -> paste & Run.
alter table public.traffic_logs
  add column if not exists app text;

alter table public.conversions
  add column if not exists app text;
