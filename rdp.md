# PRD — CPA Link Panel System (3 Panel Terpisah, Semua Berbasis Password)
### Next.js + Tailwind CSS + Supabase

---

## 1. Ringkasan Proyek

Sistem terdiri dari **3 panel/interface terpisah**, dibangun dengan **Next.js (App Router)** + **Tailwind CSS**, database & realtime pakai **Supabase**.

Ketiga panel **sama-sama login hanya pakai password** (tanpa username/email) — hanya beda siapa yang set password-nya dan data apa yang bisa diakses.

| # | Nama Panel | Password diatur oleh | Diakses oleh | Fungsi |
|---|---|---|---|---|
| 1 | **Admin Panel** | Ditentukan saat setup awal (bisa diganti sendiri dari dalam panel) | Admin (kamu) | Buat Sub ID dari Smartlink Trafee, buat/reset password Panel 2 tiap member, atur password Panel 3 |
| 2 | **Generate Link & Bulk Panel** | Admin (dibuatkan per Sub ID) | Sub ID / Member | Login pakai password masing-masing → generate link single & bulk, Sub ID otomatis tertanam |
| 3 | **Realtime Monitor Panel** | Admin (1 password bersama) | Semua Sub ID / Member | Melihat semua traffic & konversi (postback dari Trafee) — data gabungan semua Sub ID |

---

## 2. Tujuan

1. Admin login ke Panel 1 hanya dengan password (tanpa akun/email) — password awal di-set saat deployment, bisa diganti sendiri lewat menu di dalam panel.
2. Admin input Sub ID (dari Smartlink Trafee) + buat password Panel 2 → didistribusikan ke member.
3. Admin set 1 password Panel 3, dibagikan ke semua member supaya semua bisa pantau performa bersama.
4. Semua sesi login (Panel 1/2/3) berbasis password + cookie session, tanpa sistem akun/username sama sekali.

---

## 3. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime (`postgres_changes` di `traffic_logs` & `conversions`) |
| Auth Panel 1 (Admin) | 1 password (bcrypt hash di tabel `admin_access`), tanpa username, session JWT cookie |
| Auth Panel 2 (Member) | Password per Sub ID (bcrypt hash di `panels`), session JWT berisi `panel_id` |
| Auth Panel 3 (Monitor) | 1 password bersama (bcrypt hash di `monitor_access`), session JWT umum |
| Hosting | Vercel (Panel 1, 2, 3) + domain terpisah khusus redirect |
| Redirect handler | Project/domain terpisah, Edge Runtime |

> Tidak lagi pakai Supabase Auth — cukup 3 tabel kredensial sederhana + JWT cookie custom. Lebih ringan dan sesuai kebutuhan (semua akses = password saja, tanpa manajemen akun).

---

## 4. Arsitektur Sistem

```
Trafee Smartlink ──(postback: sub_id, earning)──► /api/postback
                                                          │
                                                          ▼
                                                 Supabase (Postgres)
                          ┌──────────────┬───────────────┼────────────┬──────────────┐
                          │              │               │            │              │
                   admin_access   monitor_access    traffic_logs  conversions     panels
                          │              │               │            │              │
                          │              └──────┬────────┘            │              │
                          │                     ▼                     │              │
                          │        PANEL 3: Realtime Monitor          │              │
                          │        (password bersama, SEMUA data)     │              │
                          │                                           │              │
              PANEL 1: Admin (password sendiri)                       │              │
                          │── buat Sub ID + password Panel 2 ─────────┴──────────────┘
                          │── set/reset password Panel 3
                          │── ganti password Panel 1 sendiri
                          │
                          └── PANEL 2: Generate Link & Bulk (password per Sub ID)
                                        │
                                        ▼
                        Slug dibuat, sub_id member otomatis ditempel
                                        │
                                        ▼
                     User klik link → [DOMAIN REDIRECT TERPISAH]/[slug]
                                        │
                                        ▼
                   Catat traffic_logs (sub_id ikut tercatat) → redirect
```

---

## 5. Role & Alur Pengguna

### 5.1 Panel 1 — Admin
- Login: `/admin/login` — **1 field password saja**, tanpa username.
- Password awal disimpan sebagai environment variable saat deploy pertama kali (`INITIAL_ADMIN_PASSWORD`), lalu otomatis di-hash & disimpan ke tabel `admin_access` saat pertama kali dipakai (atau di-seed manual lewat SQL).
- Di dalam panel, ada menu **"Ganti Password Admin"** (masukkan password lama + password baru).
- **Kelola Sub ID / Member (Panel 2)**:
  - Input Sub ID (harus sama persis dengan Smartlink Trafee), nama member/tim, generate/reset password Panel 2.
  - Nonaktifkan / hapus Sub ID.
- **Kelola Password Panel 3**:
  - Lihat & reset password bersama Panel 3 kapan saja.

### 5.2 Panel 2 — Generate Link & Bulk (per Sub ID)
- `/panel/login` — 1 field password.
- Sistem cocokkan ke `panels.password_hash` yang aktif → dapat `panel_id` & `sub_id` → session dibuat.
- Form generate link: Sub ID otomatis dari session (tidak jadi input). Single Link + Bulk Generate.
- 1 password = 1 Sub ID saja.

### 5.3 Panel 3 — Realtime Monitor (Semua Data)
- `/monitor/login` — 1 field password (password bersama, di-set admin di Panel 1).
- Setelah login: dashboard realtime — Live Traffic, Top Performance per Sub ID, Top Country, tabel Realtime & Reports, filter tanggal, toggle currency, toast lead baru + suara — **menampilkan gabungan semua Sub ID**.
- Read-only, tidak bisa generate link dari sini.

### 5.4 Trafee (System)
- Kirim postback ke `/api/postback` (sub_id, earning, country, ip, dll).

---

## 6. Skema Database (Supabase / Postgres)

```sql
-- ADMIN ACCESS: kredensial Panel 1 (hanya 1 baris aktif)
create table admin_access (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,           -- bcrypt hash, diganti sendiri dari dalam panel
  updated_at timestamptz default now()
);

-- MONITOR ACCESS: kredensial bersama Panel 3 (hanya 1 baris aktif)
create table monitor_access (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,           -- bcrypt hash, diatur admin
  updated_at timestamptz default now()
);

-- PANEL: 1 baris = 1 Sub ID + kredensial akses Panel 2
create table panels (
  id uuid primary key default gen_random_uuid(),
  sub_id text not null unique,           -- WAJIB sama persis dgn Sub ID Smartlink Trafee
  panel_name text not null,              -- nama member/tim (label internal)
  password_hash text not null,           -- bcrypt hash, password khusus Panel 2 utk sub id ini
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login_at timestamptz
);

-- REDIRECTS
create table redirects (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references panels(id) on delete cascade,
  sub_id text not null,                  -- disalin otomatis dari panels.sub_id saat insert
  slug text not null unique,
  destination_url text not null,
  link_name text,
  og_title text,
  og_description text,
  og_image text,
  clicks integer default 0,
  created_at timestamptz default now()
);

-- TRAFFIC LOGS
create table traffic_logs (
  id uuid primary key default gen_random_uuid(),
  redirect_id uuid references redirects(id) on delete set null,
  panel_id uuid references panels(id),
  sub_id text,
  ip_address text,
  country text,
  browser_app text,
  os_device text,
  created_at timestamptz default now()
);

-- CONVERSIONS (dari postback Trafee)
create table conversions (
  id uuid primary key default gen_random_uuid(),
  redirect_id uuid references redirects(id) on delete set null,
  panel_id uuid references panels(id),
  sub_id text,
  network_name text default 'Trafee',
  country text,
  earning numeric(12,2) default 0,
  ip_address text,
  browser_app text,
  os_device text,
  created_at timestamptz default now()
);

create index idx_traffic_panel on traffic_logs(panel_id);
create index idx_conversions_panel on conversions(panel_id);
create index idx_redirects_panel on redirects(panel_id);
create index idx_panels_sub_id on panels(sub_id);
```

**Catatan `admin_access` & `monitor_access`**: sengaja dibuat tabel terpisah berisi 1 baris saja (bukan hard-code di environment variable) supaya password **bisa diganti dari dalam aplikasi** tanpa perlu re-deploy. Password awal (baris pertama) di-seed sekali lewat SQL migration atau lewat environment variable saat setup pertama.

### Row Level Security (RLS)
- Semua tabel: **deny by default** untuk anon key.
- Semua akses lewat API Route server-side dengan `service_role key` — termasuk proses cek password (bcrypt compare dilakukan di server, bukan di browser).
- `panel_id` untuk Panel 2 selalu dari session server-side.
- Panel 3 & Panel 1 tidak butuh filter `panel_id` — memang didesain mengambil semua data.

---

## 7. Struktur Folder Next.js

```
/app
  /admin
    /login/page.tsx                → 1 field password
    /dashboard/page.tsx
    /panels/page.tsx               → list & create Sub ID + password Panel 2
    /panels/[id]/page.tsx          → detail, reset password, nonaktifkan
    /monitor-access/page.tsx       → lihat/reset password Panel 3
    /change-password/page.tsx      → ganti password Panel 1 sendiri
  /panel
    /login/page.tsx                → 1 field password (Panel 2)
    /dashboard/page.tsx            → Generate Link + Bulk (sub_id auto-locked)
  /monitor
    /login/page.tsx                → 1 field password (Panel 3)
    /dashboard/page.tsx            → Realtime Monitor, semua data
  /api
    /postback/route.ts
    /admin/auth/route.ts           → cek password vs admin_access
    /admin/change-password/route.ts
    /admin/panels/route.ts
    /admin/monitor-access/route.ts
    /panel/auth/route.ts           → cek password vs panels.password_hash
    /panel/redirects/route.ts
    /panel/bulk/route.ts
    /monitor/auth/route.ts         → cek password vs monitor_access
    /monitor/stats/route.ts

# Project terpisah (domain redirect)
/app
  /[slug]/route.ts                 → redirect handler + bot detection (Edge Runtime)

/lib
  supabaseAdmin.ts
  session.ts          → sign/verify JWT cookie (3 tipe: admin / panel / monitor)
  password.ts          → bcrypt hash/compare
```

---

## 8. Detail Fitur

### 8.1 Panel 1 (Admin)
- Login 1 field password → validasi ke `admin_access`.
- Menu "Ganti Password Admin" (password lama + baru, min. panjang tertentu, di-hash ulang).
- Form buat Sub ID baru: Sub ID (dari Smartlink Trafee), Nama Member/Tim, Password Panel 2 (auto-generate/manual) — password ditampilkan **sekali** saat dibuat (plaintext), setelahnya hanya bisa di-reset (bukan dilihat lagi, karena sudah di-hash).
- Tabel semua Sub ID: status, jumlah link, total klik, last login, tombol Reset Password / Nonaktifkan / Hapus.
- Halaman "Password Monitor": tombol generate/reset password Panel 3, ditampilkan sekali saat dibuat/diganti.

### 8.2 Panel 2 — Generate Link & Bulk
- Login 1 field password → cocok ke salah satu `panels.password_hash` aktif.
- Form generate: slug custom/random, OG title/desc/image, mode single & bulk — Sub ID otomatis dari session.
- Tabel daftar link Sub ID ini + jumlah klik.

### 8.3 Panel 3 — Realtime Monitor
- Login 1 field password → cocok ke `monitor_access`.
- Dashboard realtime penuh: Live Traffic feed, Top Performance per Sub ID, Top Country, tabel Realtime & Reports, filter tanggal, toggle currency USD/IDR, toast lead baru + suara — data gabungan semua Sub ID.
- Opsional dropdown filter per Sub ID.

### 8.4 Redirect Handler (Domain Terpisah)
- Deteksi bot → render OG meta; bukan bot → catat `traffic_logs` (ikut simpan `panel_id`) → redirect 302.

### 8.5 Postback Endpoint (`/api/postback`)
- Cari `panel_id` dari `sub_id` yang dikirim Trafee → simpan ke `conversions`.
- Jika `sub_id` tidak match → tetap simpan (`panel_id = null`), tandai "Unmatched" untuk dicek admin.

---

## 9. Autentikasi & Keamanan — Ringkasan

| Aspek | Implementasi |
|---|---|
| Panel 1 (Admin) | 1 password (bcrypt, tabel `admin_access`), bisa diganti sendiri, tanpa username |
| Panel 2 (Member) | Password per Sub ID (bcrypt, tabel `panels`), session JWT berisi `panel_id` |
| Panel 3 (Monitor) | 1 password bersama (bcrypt, tabel `monitor_access`), session JWT umum |
| Semua bcrypt compare | Dilakukan di server (API Route), tidak pernah di client |
| Sumber Sub ID di link | Selalu dari session Panel 2, tidak pernah dari input form |
| RLS Supabase | Aktif di semua tabel, deny by default |
| Rate limiting | Wajib di ketiga halaman login (`/admin/login`, `/panel/login`, `/monitor/login`) untuk cegah brute-force, dan di `/api/postback` |
| Reset akses | Admin bisa reset password Panel 2 per Sub ID & password Panel 3 kapan saja; password Panel 1 diganti sendiri oleh admin |
| Domain terpisah | Redirect (`/[slug]`) beda domain dari Panel 1/2/3 |

---

## 10. Fase Pengembangan (Roadmap)

**Fase 1 — Fondasi**: Setup Next.js + Tailwind + Supabase, migrasi skema, seed password awal Panel 1.

**Fase 2 — Panel 1 Lengkap**: Login password admin, ganti password sendiri, CRUD Sub ID + password Panel 2, kelola password Panel 3.

**Fase 3 — Panel 2**: Login password per Sub ID, generate link single + bulk (auto-locked sub id).

**Fase 4 — Redirect & Postback**: domain terpisah untuk `/[slug]`, endpoint `/api/postback`, pencocokan `panel_id`.

**Fase 5 — Panel 3**: Login password bersama, Realtime Monitor (semua data, Supabase Realtime).

**Fase 6 — Polish**: rate limiting login, cleanup job retensi data, reports, testing, deploy.

---

## 11. Catatan Migrasi dari Script Lama

- Logic cek password di `getLoginHtml()`/`env.ADMIN_PASSWORD` pada script lama jadi basis pola yang sama dipakai di ketiga panel (password-only, tanpa username) — bedanya sekarang disimpan ter-hash di tabel Supabase, bukan plain di environment variable, supaya bisa diganti tanpa re-deploy.
- Dashboard realtime lama (script 1) jadi basis **Panel 3**; form generate link lama (script 2) jadi basis **Panel 2**; kelola Sub ID/password adalah fitur baru di **Panel 1**.
- Logo & skema warna dark navy `#0d1117` + emerald `#10b981` dipertahankan lewat `tailwind.config`.
- `cleanupOldData` (retensi traffic/lead) → Supabase Edge Function + `pg_cron`.

---