---
alwaysApply: true
---

# Aturan proyek: instance RAIDWEAR (repo fork)

Repo ini adalah **fork** dari `raidwear/raidwear`. Auto-sync harian
(`.github/workflows/fork-sync.yml`) menggabungkan commit upstream ke branch
`master` repo ini. Karena itu setiap perubahan harus ditulis agar tidak bentrok
dan tidak merusak sinkronisasi.

## Aturan keras (tidak boleh dilanggar)

1. **Jangan pernah** meminta, menampilkan, menulis, atau meng-commit rahasia apa
   pun: Personal Access Token Supabase, database password, `service_role` key,
   kredensial Cloudflare R2. Kalau butuh nilai rahasia, berhenti dan minta
   pengguna memasukkannya sendiri.
2. **Jangan mengubah `.github/workflows/fork-sync.yml`.** Berkas itu dibekukan.
   Seluruh logika auto-sync ada di `scripts/fork-sync.sh`.
3. **Jangan menghapus atau mengganti nama file di `supabase/migrations/`.**
   Perubahan skema ditambahkan sebagai file **baru**.
4. **Jangan mengganti nama default branch** (`master`).
5. **Jangan menaruh rahasia di variabel `NEXT_PUBLIC_*`** — nilai itu terkirim
   ke browser.
6. **Setiap perintah `supabase` yang menyentuh database wajib memakai
   `--project-ref <ref milik fork ini>`.** `supabase/config.toml` berisi project
   ref milik owner; tanpa flag itu perintah bisa menyentuh database orang lain.

## Menulis kode agar aman dari konflik auto-sync

- Utamakan **menambah file/komponen baru** daripada mengubah file inti bersama
  (`src/app/**`, `src/components/**`, `src/lib/**`, `package.json`,
  `supabase/config.toml`).
- Kalau memang harus mengubah file inti, ubah sesedikit mungkin dan jelaskan
  alasannya kepada pengguna.
- Jangan memformat ulang (reformat) berkas yang tidak berkaitan — itu membuat
  konflik palsu dengan upstream.

## Perubahan skema database

Tambahkan berkas baru `supabase/migrations/YYYYMMDDHHMMSS_nama_perubahan.sql`:

- **Idempotent** — aman dijalankan berulang: `if not exists`,
  `on conflict do nothing`, `drop policy if exists`, dan sejenisnya.
- Prefix timestamp harus **lebih besar** dari berkas migrasi terakhir.
- Jangan mengedit berkas migrasi yang sudah ada.

## Gaya kode

- Bahasa komentar dan pesan commit: **Bahasa Indonesia**.
- Ikuti pola yang sudah ada di repo (Next.js App Router, TypeScript, Tailwind).
- Komponen baru diletakkan mengikuti struktur folder yang berlaku.

## Sebelum menyatakan tugas selesai

1. Jalankan `npm run lint` — harus lolos.
2. Jalankan `npm run build` — harus lolos.
3. Ringkas perubahan, lalu minta pengguna mengonfirmasi sebelum `git push`.
