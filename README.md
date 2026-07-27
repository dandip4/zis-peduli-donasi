# Forum ZIS Peduli

Proyek ini adalah aplikasi donasi berbasis web untuk mempublikasikan kampanye donasi, menampilkan daftar donatur, dan menyediakan panel admin untuk mengelola data donatur serta target kampanye.

## Ringkasan proyek

Aplikasi ini dibangun menggunakan:

- React + TypeScript
- TanStack Start
- Tailwind CSS
- Supabase untuk autentikasi dan database

Fitur utama:

- Halaman publik untuk menampilkan informasi donasi dan progres terkumpul
- Daftar donatur yang diambil dari database Supabase
- Halaman admin untuk login, mengelola donatur, dan mengubah target donasi

## Struktur folder penting

- src/routes/ — halaman publik dan admin
- src/integrations/supabase/ — koneksi dan middleware Supabase
- src/components/ui/ — komponen UI berbasis shadcn/ui
- supabase/migrations/ — skema database yang dipakai proyek

## Prasyarat

Pastikan perangkat Anda telah menginstall:

- Node.js 20+ (disarankan)
- npm

## Cara menjalankan proyek

1. Clone repository dan masuk ke folder proyek

```bash
git clone <repository-url>
cd zis-peduli-donasi
```

2. Install dependency

```bash
npm install
```

3. Siapkan file environment

Buat file .env berdasarkan variabel yang dibutuhkan. Contoh minimal:

```env
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
```

Jika ingin memakai fitur admin yang lebih lengkap di sisi server, tambahkan juga:

```env
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

4. Jalankan aplikasi dalam mode development

```bash
npm run dev
```

Aplikasi akan berjalan dan menampilkan URL lokal yang tersedia di terminal, biasanya berupa http://localhost:3000 atau http://localhost:5173.

## Build untuk produksi

```bash
npm run build
```

## Preview build

```bash
npm run preview
```

## Admin panel

Halaman admin tersedia di path `/admin`.

Agar dapat mengakses panel admin, pengguna harus:

- login melalui Supabase Auth
- memiliki role `admin` pada tabel `user_roles`

## Database

Proyek ini mengandalkan Supabase sebagai backend. Tabel yang dipakai secara umum:

- donors
- campaign_settings
- user_roles

Skema migrasi dapat ditemukan di folder supabase/migrations.

## Troubleshooting

- Jika halaman menampilkan error terkait Supabase, pastikan nilai URL dan kunci publik sudah benar di file .env.
- Jika admin tidak bisa masuk, cek apakah akun sudah memiliki role admin di tabel `user_roles`.
- Jika dependensi bermasalah, coba hapus folder node_modules lalu jalankan `npm install` ulang.
