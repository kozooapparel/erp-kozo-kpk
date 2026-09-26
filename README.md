# RAIDWEAR

ERP penjualan & produksi apparel: order, invoice, kuitansi, HR, dan stok barang.

Repo ini adalah **upstream publik**. Setiap pemakai menjalankan instance-nya
sendiri dengan cara **fork**: kode auto-sync dari repo ini, dan database
Supabase-nya dimigrasikan otomatis setiap hari.

## Onboarding

### 1. Fork repo ini

Klik **Fork** di kanan atas, fork ke akun/org milikmu.

### 2. Siapkan project Supabase

Buat project Supabase, lalu catat:

- **Project ref** — terlihat di URL dashboard Supabase: `https://supabase.com/dashboard/project/<project-ref>`
- **Database password** — password yang kamu isi saat membuat project

Buat juga **Personal Access Token** di halaman Account > Access Tokens Supabase.

### 3. Isi 3 secret di fork

Di fork-mu: **Settings > Secrets and variables > Actions > New repository secret**.

| Nama secret | Isinya |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token Supabase dari langkah 2 |
| `SUPABASE_PROJECT_REF` | project ref Supabase-mu |
| `SUPABASE_DB_PASSWORD` | database password Supabase-mu |

Tanpa secret ini workflow tetap jalan, tapi migrasi database di-skip.

### 4. Aktifkan Actions di fork

GitHub mematikan workflow di repo hasil fork, jadi jadwal hariannya tidak akan
pernah jalan sampai kamu mengaktifkannya sekali. Buka tab **Actions**, lalu klik
**"I understand my workflows, go ahead and enable them"**. Lewat CLI:

```bash
gh workflow enable fork-sync.yml
```

### 5. Jalankan workflow

Buka **Actions > "Sync upstream & migrasi DB" > Run workflow**. Setelah ini
workflow berjalan otomatis setiap hari pukul 09:17 WIB.

## Cara kerja auto-sync

Workflow harian mengerjakan dua hal:

1. **Sync kode** — fast-forward fork ke commit terbaru repo ini, lalu push ke
   fork. Kalau kamu deploy dari fork (mis. Vercel), deployment ikut ter-update.
2. **Migrasi database** — `supabase db push`. Hanya migrasi yang belum tercatat
   di database yang dijalankan, jadi aman diulang berkali-kali.

Berkas `.github/workflows/fork-sync.yml` sengaja dibuat setipis mungkin dan
**dibekukan**; seluruh logikanya ada di `scripts/fork-sync.sh`. Jangan mengubah
berkas workflow itu tanpa alasan kuat — lihat bagian Pemulihan di bawah.

### Kalau auto-sync berhenti sendiri

GitHub menonaktifkan workflow terjadwal di repo publik yang tidak menerima
commit selama 60 hari. Kalau itu terjadi, buka tab **Actions** dan klik
**Enable workflow** untuk menyalakannya kembali.

### Kalau database-mu sudah ada sebelum memakai repo ini

Skemanya dibuat manual, sehingga `db push` akan mencoba membuat ulang tabel yang
sudah ada dan gagal. Jalankan workflow sekali dengan opsi
**`mark_all_as_applied` dicentang**: semua migrasi yang ada di repo ditandai
"sudah diterapkan" tanpa dijalankan.

**Jangan dicentang** untuk database baru atau kosong — versi yang ditandai
"sudah diterapkan" tidak akan pernah dijalankan lagi.

### Kalau kamu mengganti password database Supabase

Perbarui secret `SUPABASE_DB_PASSWORD` supaya migrasi tetap bisa berjalan.

## Pemulihan: push auto-sync ditolak

GitHub melarang token bawaan Actions (`GITHUB_TOKEN`) membuat atau mengubah
berkas di `.github/workflows/`. Kalau repo ini suatu saat mengubah berkas
workflow, langkah push di fork-mu akan ditolak dengan pesan:

```
refusing to allow a GitHub App to create or update workflow ... without workflows permission
```

Migrasi database tetap dijalankan, jadi datamu tidak terpengaruh. Perbaikannya
sekali saja: buka fork-mu di GitHub, klik **Sync fork > Update branch**, lalu
jalankan ulang workflow.

Auto-sync memakai `--ff-only`, jadi kalau kamu menambah commit sendiri di fork,
sync akan berhenti dan melaporkan error alih-alih menimpa perubahanmu.

## Development lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Deploy

Repo ini siap dideploy ke Vercel. Hubungkan repo fork-mu di Vercel, isi
environment variable yang dibutuhkan, lalu setiap push dari auto-sync akan
memicu deployment baru.
