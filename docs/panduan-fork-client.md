# Panduan lengkap: fork RAIDWEAR untuk client baru

Panduan ini menuntun pemilik akun baru (client) dari nol sampai aplikasi berjalan
di domain sendiri: kode tersinkron otomatis dari repo upstream, database
bermigrasi sendiri tiap hari, dan deploy otomatis lewat Vercel.

Urutan besar: **fork → Supabase → secret → Actions → akun owner → Vercel →
(opsional) Cloudflare R2 → verifikasi**.

---

## 0. Cara kerja singkat

Setiap client memakai **repo, database, dan hosting-nya sendiri**. Tidak ada data
yang berpindah antar client.

| Bagian | Milik siapa | Cara update |
| --- | --- | --- |
| Kode aplikasi | repo fork milik client | auto-sync harian dari `raidwear/raidwear` |
| Database | project Supabase milik client | `supabase db push` otomatis, idempotent |
| Hosting | project Vercel milik client | auto-deploy setiap push |
| File/gambar | bucket R2 milik client (opsional) | manual lewat menu Penyimpanan |

Alur harian:

```
repo upstream (raidwear/raidwear)
        │  cron 09:17 WIB: fetch + merge + push
        ▼
repo fork client ──► Vercel auto-deploy
        │
        └─ supabase db push --project-ref <ref-milik-client>
                     ▼
           database Supabase milik client
```

---

## 1. Prasyarat

- Akun **GitHub** (gratis cukup).
- Akun **Supabase** — plan gratis cukup untuk mulai.
- Akun **Vercel** — plan Hobby/Pro.
- **(Opsional)** akun **Cloudflare** kalau mau memakai penyimpanan R2.
- Untuk pengembangan lokal: **Node.js 20+** dan **git**.

---

## 2. Fork repo

1. Buka `https://github.com/raidwear/raidwear`.
2. Klik tombol **Fork** (kanan atas) → pilih akun/organisasi tujuan → **Create fork**.
3. Tunggu sampai selesai. Sekarang kamu punya `https://github.com/<akunmu>/raidwear`.

> **Penting**: jangan mengubah nama default branch. Workflow meng-hardcode
> `ref: master`. Kalau default branch diganti (mis. jadi `main`), auto-sync tidak
> akan menemukan branch-nya dan workflow gagal.

---

## 3. Buat project Supabase

1. Buka `https://supabase.com/dashboard` → **New project**.
2. Isi nama project, pilih region terdekat (mis. **Singapore**), dan isi
   **Database Password**. Simpan password itu — dibutuhkan sebagai secret.
3. Tunggu project selesai dibuat (beberapa menit).

Lalu catat 6 nilai berikut:

| # | Nilai | Lokasi di dashboard Supabase |
| --- | --- | --- |
| 1 | **Project URL** | Project Settings → API → Project URL (`https://<ref>.supabase.co`) |
| 2 | **anon public key** | Project Settings → API → Project API keys → `anon` `public` |
| 3 | **service_role key** | Project Settings → API → Project API keys → `service_role` |
| 4 | **Project ref** | terlihat di URL dashboard: `/project/<project-ref>`, atau Project Settings → General |
| 5 | **Database password** | password yang kamu isi di langkah 2 |
| 6 | **Personal Access Token** | Account → Access Tokens → **Generate new token** |

- Nilai **1, 2, 3, 6** dipakai aplikasi & workflow.
- Nilai **4 dan 5**, plus token **6**, diisi sebagai secret GitHub di langkah 4.
- **Nilai 3 (`service_role`) bersifat rahasia** — hanya untuk environment variable
  Vercel, jangan pernah ditaruh di variabel `NEXT_PUBLIC_*` atau di commit.

---

## 4. Isi 3 secret di repo fork

Di repo fork-mu: **Settings → Secrets and variables → Actions → New repository secret**.

| Nama secret | Isinya |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token Supabase (nilai 6) |
| `SUPABASE_PROJECT_REF` | project ref Supabase-mu (nilai 4) |
| `SUPABASE_DB_PASSWORD` | database password Supabase-mu (nilai 5) |

Ketiganya harus ada. Kalau `SUPABASE_PROJECT_REF` kosong, workflow tetap jalan
tetapi hanya menyinkronkan kode — migrasi database di-skip dan muncul warning.

---

## 5. Aktifkan Actions di repo fork

GitHub mematikan workflow di repo hasil fork, jadi jadwal hariannya tidak akan
pernah jalan sampai kamu mengaktifkannya sekali.

1. Buka tab **Actions** di repo fork.
2. Klik **"I understand my workflows, go ahead and enable them"**.

Lewat CLI (opsional):

```bash
gh workflow enable fork-sync.yml
```

---

## 6. Jalankan workflow pertama

1. Buka **Actions → "Sync upstream & migrasi DB"**.
2. Klik **Run workflow** (kanan atas) → branch **`master`**.
3. Biarkan opsi **`mark_all_as_applied` tidak dicentang** — centang hanya untuk
   database lama yang tabelnya sudah dibuat manual (lihat bagian 13).

Setelah run pertama ini, workflow berjalan sendiri setiap hari.

Log yang diharapkan pada database baru:

```
Kode fork sudah sama dengan upstream.
Remote database is up to date.
Selesai.
```

Kalau `SUPABASE_PROJECT_REF` terisi tetapi log berbunyi
`Remote database is up to date`, artinya seluruh skema sudah diterapkan.

---

## 7. Buat akun owner pertama

Migrasi hanya membuat **skema** (tabel, policy, fungsi). Akun login pertama tetap
harus dibuat sekali, karena tidak ada user di dalam database baru.

1. Buka Supabase → **SQL Editor** → **New query**.
2. Salin isi `supabase/scripts/create_owner_user.sql` dari repo, jalankan.
3. Login ke aplikasi dengan:
   - Email: `owner@raidwear.com`
   - Password: `Admin123!`
4. **Segera ganti password** setelah login pertama (menu pengguna di kanan atas).

Opsional:

| File | Kegunaan |
| --- | --- |
| `supabase/scripts/create_admin_user.sql` | menambah akun `admin@raidwear.com` (role admin) |
| `supabase/scripts/seed_barang_master.sql` | mengisi daftar barang awal (master produk) |
| `supabase/scripts/verify_and_fix_owner.sql` | dipakai kalau login owner gagal / role salah |

Menu **Settings** (Kelola User, Brand, Penyimpanan File) hanya muncul untuk role
`owner`.

---

## 8. Deploy ke Vercel

1. Buka `https://vercel.com/new` → **Import Git Repository** → pilih repo fork-mu.
2. Framework terdeteksi otomatis (**Next.js**). Biarkan build command default.
3. Tambahkan **Environment Variables** di bagian Environment Variables:

| Nama | Nilai | Environment |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (nilai 1) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key (nilai 2) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (nilai 3) | Production, Preview, Development |
| `R2_CREDENTIAL_ENCRYPTION_KEY` | kunci enkripsi kredensial R2 (lihat di bawah) | Production, Preview, Development |

Buat `R2_CREDENTIAL_ENCRYPTION_KEY` sekali dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Simpan nilainya di tempat aman. Kalau kunci ini diganti setelah client menyimpan
kredensial penyimpanan, kredensial lama tidak bisa dibaca lagi dan harus
disimpan ulang lewat menu Penyimpanan.

4. Klik **Deploy**, lalu buka domain yang diberikan (mis. `<project>.vercel.app`).

Jangan menyalin `VERCEL_OIDC_TOKEN` ke daftar variabel — Vercel mengisinya sendiri.

> Karena auto-sync melakukan `git push` ke fork, setiap sinkronisasi kode akan
> memicu deployment baru di Vercel secara otomatis. Tidak perlu deploy manual.

---

## 9. (Opsional) Aktifkan penyimpanan file — Cloudflare R2

Aplikasi menyimpan setiap file tenant di bucket R2 milik tenant itu sendiri.
Langkah lengkap ada di [`docs/cloudflare-r2.md`](./cloudflare-r2.md). Ringkasnya:

1. Buat bucket R2 **private** di akun Cloudflare client.
2. Buat R2 API token yang dibatasi hanya ke bucket itu, dengan izin
   **Object Read**, **Object Write**, dan **List**.
3. Buat pasangan S3 access key + secret untuk token tersebut.
4. Di aplikasi, login sebagai **owner** → **Settings → Penyimpanan File**. Isi
   Account ID, nama bucket, access key, secret, dan endpoint
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Simpan.
5. Tambahkan CORS di bucket (izinkan `PUT`, expose header `ETag`) supaya upload
   multipart dari browser berhasil.

Kalau langkah ini dilewati, aplikasi tetap berjalan — hanya fitur upload file
yang tidak tersedia.

---

## 10. Kustomisasi identitas aplikasi

Nama dan logo yang tampil di halaman login dan sidebar diambil dari **brand
default**.

1. Login sebagai owner.
2. Buka **Settings → Brand**.
3. Ubah brand yang bertanda default: ganti **nama** dan **logo**.
4. Sinkronkan / muat ulang aplikasi — nama serta logo baru langsung dipakai.

Tambahkan user lain (admin/staff) lewat **Settings → Kelola User**.

---

## 11. Verifikasi akhir

- [ ] Repo fork ada dan default branch-nya tetap `master`.
- [ ] 3 secret (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`) terisi.
- [ ] Actions aktif, dan run terakhir **hijau** dengan log `Remote database is up to date.`
- [ ] Bisa login dengan akun owner, dan password sudah diganti.
- [ ] Vercel Production deploy **success**, aplikasi terbuka tanpa error.
- [ ] Nama & logo brand default sudah sesuai.
- [ ] (Opsional) Upload file dari menu Penyimpanan berhasil.
- [ ] (Opsional) Auto-sync harian benar-benar berjalan pada jadwal.

---

## 12. Operasional harian

**Auto-sync terjadwal.** Cron `17 2 * * *` (UTC) = **09:17 WIB** setiap hari.
Commit yang kamu push ke repo upstream akan masuk ke fork pada jadwal ini.

**Ingin lebih cepat dari jadwal?** Jalankan manual:
**Actions → "Sync upstream & migrasi DB" → Run workflow → branch `master` → Run workflow.**
Lewat CLI:

```bash
gh workflow run fork-sync.yml
```

**Mengganti password database Supabase**: perbarui secret `SUPABASE_DB_PASSWORD`,
kalau tidak migrasi berikutnya akan gagal.

**Mengganti kunci enkripsi R2**: perbarui variabel Vercel
`R2_CREDENTIAL_ENCRYPTION_KEY` **dan** simpan ulang kredensial penyimpanan tiap
tenant.

**Mengubah kode sendiri**: boleh. Tambahkan commit di fork-mu seperti biasa.
Auto-sync akan **merge**, bukan menimpa — perubahanmu tetap utuh. Kalau merge
berbenturan, workflow berhenti dengan error dan fork-mu tidak diubah sama sekali.

---

## 13. Pemecahan masalah

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| Run hijau tetapi log berbunyi `SUPABASE_PROJECT_REF belum diisi ... migrasi di-skip` | secret belum lengkap | isi 3 secret (bagian 4), jalankan ulang |
| `Merge with upstream bentrok, jadi auto-sync dihentikan` | commit lokal fork berbenturan dengan perubahan upstream | selesaikan konflik di lokal: `git fetch upstream && git merge upstream/master`, push, lalu jalankan ulang workflow |
| Push ditolak: `refusing to allow a GitHub App to create or update workflow ... without workflows permission` | upstream mengubah file di `.github/workflows/*` | sekali saja: buka fork di GitHub → **Sync fork → Update branch**, lalu jalankan ulang workflow. Migrasi DB tetap berjalan meski push kode ditolak |
| `Remote migration versions not found in local migrations directory` | ada file migrasi yang sudah tercatat di database tetapi tidak ada di repo fork (biasanya karena file migrasi terhapus di fork) | jangan menghapus/mengganti nama file migrasi yang sudah pernah jalan. Kembalikan file yang hilang (isi harus identik dengan upstream), lalu jalankan ulang |
| `db push` gagal karena tabel sudah ada | database sudah punya skema buatan manual sebelum repo ini dipakai | jalankan workflow sekali dengan opsi **`mark_all_as_applied` dicentang** |
| Workflow harian tidak pernah jalan | GitHub menonaktifkan workflow terjadwal setelah 60 hari tanpa commit | tab **Actions → Enable workflow** |
| Login ditolak / tidak ada user owner | akun owner belum dibuat (migrasi tidak membuat user) | jalankan `supabase/scripts/create_owner_user.sql`, lalu `verify_and_fix_owner.sql` bila perlu |
| Upload file gagal | R2 belum dikonfigurasi, atau CORS bucket belum diatur | ikuti `docs/cloudflare-r2.md`, lalu simpan ulang koneksi di menu Penyimpanan |
| Aplikasi error setelah deploy | environment variable Vercel kurang/typo | cek 4 variabel di bagian 8, lalu redeploy |

Catatan soal `mark_all_as_applied`: **jangan dicentang untuk database baru atau
kosong.** Versi yang ditandai "sudah diterapkan" tidak akan pernah dijalankan
lagi, sehingga tabelnya tidak akan terbentuk.

---

## 14. Aturan penting (jangan dilanggar)

1. **Jangan menghapus atau mengganti nama file migrasi** yang sudah pernah
   diterapkan di database. Repo selalu menambah file baru, tidak mengubah yang lama.
2. **Jangan mengganti nama default branch** (`master`) di repo fork.
3. **Jangan mengubah `.github/workflows/fork-sync.yml`.** Berkas itu dibekukan;
   seluruh logikanya ada di `scripts/fork-sync.sh` yang bebas berubah lewat
   auto-sync. Mengubah workflow memicu penolakan push di semua fork.
4. **Jangan commit `.env.local`.** Berkas itu sudah masuk `.gitignore`.
5. **Jangan menjalankan `supabase db push` tanpa `--project-ref <ref-milikmu>`.**
   `supabase/config.toml` berisi project ref milik owner; tanpa flag itu
   perintahmu bisa menyentuh database owner.
6. **Jangan menaruh `service_role` key atau kredensial R2 di variabel
   `NEXT_PUBLIC_*`** — variabel itu ikut terkirim ke browser.
7. Semua data, biaya Supabase/Vercel/Cloudflare, dan tanggung jawab keamanan ada
   di akun client masing-masing. Owner tidak mengakses database client.

---

## 15. Checklist ringkas

| # | Langkah | Perintah / lokasi |
| --- | --- | --- |
| 1 | Fork repo | tombol **Fork** di `raidwear/raidwear` |
| 2 | Buat project Supabase | dashboard Supabase |
| 3 | Catat 6 nilai kredensial | Project Settings → API, General, Access Tokens |
| 4 | Isi 3 secret Actions | Settings → Secrets and variables → Actions |
| 5 | Aktifkan Actions | tab Actions → enable workflows |
| 6 | Jalankan workflow pertama | Actions → Run workflow (branch `master`) |
| 7 | Buat akun owner | SQL Editor → `create_owner_user.sql` |
| 8 | Deploy Vercel + 4 env var | `vercel.com/new` |
| 9 | (Opsional) Cloudflare R2 | menu Settings → Penyimpanan File |
| 10 | Kustomisasi brand default | menu Settings → Brand |
