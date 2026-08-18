-- ============================================================
-- CPA LINK PANEL SYSTEM — Supabase / Postgres Schema
-- FILE TUNGGAL: cukup paste di Supabase Dashboard -> SQL Editor
-- dan run SEKALI untuk membuat seluruh database.
--
-- Semua akses lewat API Route server-side dengan service_role key.
-- RLS: deny by default (tanpa policy = anon tidak bisa apa-apa).
--
-- Kredensial Panel 1 (Admin) & Panel 3 (Monitor) TIDAK perlu di-seed
-- manual: aplikasi membuatnya otomatis dari env secret
-- (INITIAL_ADMIN_PASSWORD / INITIAL_MONITOR_PASSWORD) saat login
-- pertama (lihat lib/bootstrap.js). Jadi cukup run file ini.
-- ============================================================

begin;

-- ------------------------------------------------------------------
-- ADMIN ACCESS (Panel 1): 1 baris aktif
-- ------------------------------------------------------------------
create table if not exists public.admin_access (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint admin_access_single_row check (singleton)
);

-- ------------------------------------------------------------------
-- MONITOR ACCESS (Panel 3): 1 baris aktif
-- ------------------------------------------------------------------
create table if not exists public.monitor_access (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint monitor_access_single_row check (singleton)
);

-- ------------------------------------------------------------------
-- PANELS (Panel 2): 1 baris = 1 Sub ID + kredensial akses
-- ------------------------------------------------------------------
create table if not exists public.panels (
  id uuid primary key default gen_random_uuid(),
  sub_id text not null unique,
  panel_name text not null,
  smartlink_url text not null default '',
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- ------------------------------------------------------------------
-- REDIRECTS: link yang dibuat member di Panel 2
-- ------------------------------------------------------------------
create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references public.panels(id) on delete cascade,
  sub_id text not null,
  slug text not null unique,
  destination_url text not null,
  link_name text,
  og_title text,
  og_description text,
  og_image text,
  domain text not null default '',
  redirect_mode text not null default 'direct',
  link_type text not null default 'img',
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- TRAFFIC LOGS: 1 baris = 1 klik user pada link
-- ------------------------------------------------------------------
create table if not exists public.traffic_logs (
  id uuid primary key default gen_random_uuid(),
  redirect_id uuid references public.redirects(id) on delete set null,
  panel_id uuid references public.panels(id) on delete set null,
  sub_id text,
  ip_address text,
  country text,
  region text,
  city text,
  postal_code text,
  browser_app text,
  os_device text,
  app text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- CONVERSIONS: hasil postback dari Trafee
-- ------------------------------------------------------------------
create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  redirect_id uuid references public.redirects(id) on delete set null,
  panel_id uuid references public.panels(id) on delete set null,
  sub_id text,
  network_name text not null default 'Trafee',
  country text,
  earning numeric(12,2) not null default 0,
  ip_address text,
  browser_app text,
  os_device text,
  app text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- DOMAINS: domain redirect yang terdaftar + provisioning Cloudflare
-- ------------------------------------------------------------------
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

-- ------------------------------------------------------------------
-- RATE LIMITS: pencegah brute-force login & abuse postback
-- ------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------

-- Saat insert redirect, otomatis isi sub_id & panel_id dari panels
-- bila tidak diberikan (panel_id dikirim dari session server-side).
create or replace function public.redirect_set_panel_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare p public.panels%rowtype;
begin
  if new.panel_id is not null then
    select * into p from public.panels where id = new.panel_id;
    if p is not null then
      new.sub_id := p.sub_id;
    end if;
  end if;
  if new.sub_id is not null and new.panel_id is null then
    select id into new.panel_id from public.panels where sub_id = new.sub_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_redirect_set_panel_fields on public.redirects;
create trigger trg_redirect_set_panel_fields
before insert on public.redirects
for each row execute function public.redirect_set_panel_fields();

-- Setelah traffic_log tercatat, naikkan counter klik pada redirect.
create or replace function public.redirect_increment_clicks()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.redirects set clicks = clicks + 1 where id = new.redirect_id;
  return new;
end;
$$;

drop trigger if exists trg_redirect_increment_clicks on public.traffic_logs;
create trigger trg_redirect_increment_clicks
after insert on public.traffic_logs
for each row execute function public.redirect_increment_clicks();

-- Update updated_at admin_access / monitor_access
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_admin_access on public.admin_access;
create trigger trg_touch_admin_access
before update on public.admin_access
for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_monitor_access on public.monitor_access;
create trigger trg_touch_monitor_access
before update on public.monitor_access
for each row execute function public.touch_updated_at();

-- Hapus data lama (retensi). Jadwalkan via pg_cron / Edge Function.
create or replace function public.cleanup_old_data(days integer default 90)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare deleted integer := 0;
begin
  delete from public.conversions where created_at < now() - make_interval(days => days);
  deleted := deleted + row_count;
  delete from public.traffic_logs where created_at < now() - make_interval(days => days);
  deleted := deleted + row_count;
  return deleted;
end;
$$;

-- Agregat harian (grafik admin/monitor). Dipanggil via REST RPC:
-- /rest/v1/rpc/daily_aggregate?p_table=traffic_logs&p_value=earning&p_from=...&p_to=...
-- Hanya kolom/allowlist: traffic_logs | conversions ; earning | null.
create or replace function public.daily_aggregate(p_table text, p_value text, p_from timestamptz, p_to timestamptz)
returns table(day date, cnt bigint, total numeric)
language plpgsql
security definer
as $$
declare
  tbl_expr text;
  sum_expr text;
begin
  if p_table = 'traffic_logs' then
    tbl_expr := 'traffic_logs';
  elsif p_table = 'conversions' then
    tbl_expr := 'conversions';
  else
    raise exception 'unknown table: %', p_table;
  end if;

  if p_value is null then
    sum_expr := 'null::numeric';
  elsif p_value = 'earning' then
    sum_expr := 'coalesce(sum(earning),0)';
  else
    raise exception 'unknown value column: %', p_value;
  end if;

  return query execute
    'select created_at::date, count(*)::bigint, ' || sum_expr ||
    ' from ' || tbl_expr ||
    ' where created_at >= $1 and created_at <= $2' ||
    ' group by 1 order by 1'
    using p_from, p_to;
end;
$$;

grant execute on function public.daily_aggregate(text, text, timestamptz, timestamptz) to authenticator;

-- ------------------------------------------------------------------
-- ROW LEVEL SECURITY — deny by default, TANPA policy
-- (service_role key melewati RLS; semua query app memakainya)
-- ------------------------------------------------------------------
alter table public.admin_access   enable row level security;
alter table public.monitor_access enable row level security;
alter table public.panels         enable row level security;
alter table public.redirects      enable row level security;
alter table public.traffic_logs   enable row level security;
alter table public.conversions    enable row level security;
alter table public.domains        enable row level security;
alter table public.rate_limits    enable row level security;

-- ------------------------------------------------------------------
-- REALTIME: publikasikan perubahan untuk monitor
-- ------------------------------------------------------------------
alter publication supabase_realtime add table public.traffic_logs;
alter publication supabase_realtime add table public.conversions;

-- ------------------------------------------------------------------
-- POSTGREST: aktifkan agregat (count(), sum()) di REST API
-- (wajib: tanpa ini query ?select=panel_id,count() gagal PGRST123).
-- ------------------------------------------------------------------
alter role authenticator set pgrst.db_aggregates_enabled = 'true';
notify pgrst, 'reload config';

-- ------------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------------
create index if not exists idx_traffic_panel    on public.traffic_logs(panel_id);
create index if not exists idx_traffic_created  on public.traffic_logs(created_at desc);
create index if not exists idx_traffic_panel_created on public.traffic_logs(panel_id, created_at);
create index if not exists idx_traffic_sub_created  on public.traffic_logs(sub_id, created_at);
create index if not exists idx_conversions_panel on public.conversions(panel_id);
create index if not exists idx_conversions_created on public.conversions(created_at desc);
create index if not exists idx_conv_panel_created on public.conversions(panel_id, created_at);
create index if not exists idx_conv_sub_created  on public.conversions(sub_id, created_at);
create index if not exists idx_redirects_panel  on public.redirects(panel_id);
create index if not exists idx_panels_sub_id    on public.panels(sub_id);
create index if not exists idx_domains_name     on public.domains(name);

commit;
