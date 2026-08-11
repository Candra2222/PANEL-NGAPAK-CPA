# CPA Link Panel

Sistem 3 panel (Admin / Generate Link & Bulk / Realtime Monitor) berbasis **Next.js 16 (App Router) + Tailwind CSS + Supabase (Postgres + Realtime)**. Semua panel login hanya dengan password (tanpa username/email).

| # | Panel | Password diatur oleh | Fungsi |
|---|---|---|---|
| 1 | `/admin` | Admin (awal via env, bisa diganti di panel) | Kelola Sub ID, buat/reset password Panel 2, atur password Panel 3 |
| 2 | `/panel` | Admin (per Sub ID) | Generate link single & bulk, Sub ID otomatis tertanam |
| 3 | `/monitor` | Admin (1 password bersama) | Monitor realtime semua traffic & konversi |

Detail lengkap: lihat [rdp.md](./rdp.md).

---

## 1. Prasyarat

- Node.js 20+ & npm
- Project Supabase (bisa pakai akun gratis)

## 2. Setup Database Supabase

1. Buka **Supabase Dashboard** → proyek kamu.
2. Masuk ke **SQL Editor**.
3. Jalankan skrip **`supabase/schema.sql`** (buat semua tabel, trigger, RLS, dan publish Realtime).
4. Opsional: jalankan **`supabase/seed.sql`** untuk data contoh, atau biarkan kosong (password awal dibuat otomatis dari env).

## 3. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Isi `.env.local`:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Dashboard → Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (khusus server, jangan bocor) |
| `AUTH_SECRET` | String acak panjang untuk JWT, mis. `openssl rand -base64 32` |
| `INITIAL_ADMIN_PASSWORD` | Password awal Panel 1 (dipakai saat tabel `admin_access` masih kosong) |
| `INITIAL_MONITOR_PASSWORD` | Password awal Panel 3 (dipakai saat tabel `monitor_access` masih kosong) |
| `REDIRECT_DOMAIN` | Domain redirect, mis. `go.panel-cpa.id` |
| `REDIRECT_DOMAINS` | (opsional) Daftar domain dipisah koma untuk opsi pilihan member |
| `POSTBACK_TOKEN` | (opsional) Token pengaman endpoint postback |

> Jangan pernah commit `.env.local`. File tersebut sudah dikecualikan di `.gitignore`.

**Cara password awal bekerja**: saat pertama login Panel 1, jika tabel `admin_access` masih kosong, sistem otomatis menulis hash dari `INITIAL_ADMIN_PASSWORD`. Hal yang sama berlaku untuk `monitor_access` (Panel 3) dan Panel 2 di-generate saat admin membuat Sub ID.

## 4. Menjalankan

```bash
npm install
npm run dev        # development
npm run build      # production build
npm start          # production server
```

## 5. Endpoint Penting

### Postback dari Trafee

Kirim konversi ke endpoint postback (GET atau POST):

```
POST /api/postback
Content-Type: application/json

{ "sub_id": "trafee_001", "earning": 3.5, "country": "ID", "ip": "1.2.3.4" }
```

- Jika `POSTBACK_TOKEN` diset, sertakan header `x-postback-token: <token>`.
- `sub_id` dicocokkan ke tabel `panels`; jika tidak cocok tetap disimpan dengan `panel_id = null` (Unmatched) untuk dicek admin.
- Rate limit: 60 request/menit per IP.

### Redirect Link

```
GET /[slug]     (mis. https://go.panel-cpa.id/penawaran-agustus)
```

- Bot/crawler/preview → HTML dengan meta OG.
- Browser manusia → catat `traffic_logs` lalu redirect 302 (atau mode spinner bila diatur).
- Mode `spinner` = tampil halaman spinner 0.2 detik sebelum pindah (untuk angka klik yang lebih akurat).

## 6. Alur Setup Baru (Admin)

1. Jalankan schema + set env password awal.
2. Login `/admin/login` → buat Sub ID di menu **Panels** (munculkan password Panel 2 sekali, simpan baik-baik).
3. Bagikan password Panel 2 ke member masing-masing → member login `/panel/login`, generate link, dan sebar link `https://domain-redirect/slug`.
4. Atur password Panel 3 di menu **Monitor Access** → bagikan ke semua member agar bisa pantau bersama di `/monitor/login`.

## 7. Keamanan

- **RLS deny-by-default** di semua tabel; semua akses lewat API Route dengan `service_role key` (server-side).
- Password disimpan **bcrypt hash**, tidak pernah dikirim plaintext ke client (kecuali sekali saat dibuat/reset oleh admin).
- Session **JWT httpOnly cookie** (12 jam) untuk ketiga panel.
- **Rate limit** di semua halaman login (8 percobaan/menit/IP) dan postback (60/menit/IP), berbasis DB.
- Token postback opsional (`POSTBACK_TOKEN`) untuk memfilter sumber yang boleh mengirim konversi.
