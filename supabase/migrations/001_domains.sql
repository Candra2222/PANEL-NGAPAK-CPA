-- Migration: Create domains table + seed existing Cloudflare domains
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel domains
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  zone_id text,
  cf_domain_id text,
  cf_route_id text,
  is_active boolean not null default true,
  dns_status text not null default 'pending',
  added_at timestamptz not null default now()
);

alter table public.domains enable row level security;
create index if not exists idx_domains_name on public.domains(name);

-- 2. Seed domain existing dari Cloudflare
insert into public.domains (name, zone_id, cf_domain_id, cf_route_id, is_active, dns_status)
values
  ('fumifun.sbs', '68e15cd444172b48aedf873b42eae7a7', '400d163430e4f28a00d6571c73bb4fd7a53f1360', '7ea16571972a45a59d42c4b30729e013', true, 'verified'),
  ('girlsnaughty.fun', '62821714268e73ced59bf953753af84f', '4b4b28a03839e6748409757989fe04f023ffa353', 'b8287ec5ecf24d1d9696fea6c284fd7a', true, 'verified')
on conflict (name) do nothing;
