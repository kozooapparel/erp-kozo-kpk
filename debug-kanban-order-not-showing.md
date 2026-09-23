# Debug Session: kanban-order-not-showing

**Status:** [CLOSED] — Dikonfirmasi Fixed oleh user

## Gejala
- Tambah order berhasil (insert berhasil) tapi order baru tidak muncul di kanban.

## Hipotesis
1. **H1 - Stage mismatch / stage_entered_at tidak diset**: Order baru dibuat dengan stage `customer_dp_desain` tapi `stage_entered_at` kosong/null, sehingga `isBottleneck` atau filter crash, atau order gagal dikelompokkan.
2. **H2 - Realtime subscription tidak memicu refresh**: `router.refresh()` tidak berjalan setelah insert karena Realtime event tidak terkirim/terdaftar.
3. **H3 - AddOrderModal insert gagal tapi error ditelan**: Insert order error (mis. constraint `stage_entered_at` NOT NULL) tapi error handling tidak menampilkan, modal tertutup, order tidak tersimpan.
4. **H4 - Supabase RLS / is_archived filter**: Order tersimpan dengan `is_archived=true` atau tidak terlihat karena query dashboard memfilter `is_archived=false`.
5. **H5 - Stage value tidak valid**: Nilai `stage` yang di-insert tidak cocok dengan `STAGES_ORDER`, sehingga tidak masuk kolom mana pun.

## Bukti yang Dikumpulkan
**Statis (analisis kode):**
- `dashboard/page.tsx` line 38: query `orders` dengan filter `.eq('is_archived', false)`.
- `STAGES_ORDER` (database.ts:569) memuat `proses_layout`, `cutting_jahit`. CHECK constraint di migration `20260117000000_initial_schema.sql` line 54-66 TIDAK memuat kedua stage tsb.
- `AddOrderModal` line 68: insert dengan `stage: 'customer_dp_desain'` (aman dari CHECK constraint).
- `AddOrderModal` line 84: `router.refresh()` dipanggil setelah insert.
- `KanbanBoardWrapper` line 49-66: Realtime subscription di tabel `orders` → `router.refresh()`.

**Runtime (REST query langsung ke Supabase project `qzsmtikhimbjowpvtjst` dari `.env.local`):**
- Query `orders` dengan select `is_archived`: **ERROR 42703** "column orders.is_archived does not exist".
- Query `orders` tanpa `is_archived` berhasil tapi data kosong (Count: 0).
- Query `customers` juga kosong.
- Supabase lokal (port 54321) TIDAK berjalan.
- → Project `qzsmtikhimbjowpvtjst` adalah project kosong, TIDAK ada schema `is_archived`.

**Konsekuensi H4 (terkonfirmasi):**
Karena kolom `is_archived` tidak ada di DB, query `dashboard/page.tsx`:
```js
const { data: orders } = await supabase
    .from('orders')
    .select(`*`)
    .eq('is_archived', false)   // ← throws 42703
```
Akan **error**. `data` = `null`, fallback `orders || []` di return. **Kanban selalu kosong.**

**Namun**, jawaban user mengatakan "order lama tampil, hanya order baru tidak muncul". Ini tidak cocok dengan hasil runtime jika environment = `qzsmtikhimbjowpvtjst`. Kemungkinan:
- User menjalankan di Supabase/project lain yang memang punya kolom `is_archived`, dan ada masalah berbeda.
- User keliru tentang "order lama tampil" (mungkin render server cached).
- Vercel production pakai env yang berbeda dari `.env.local`.

## Kesimpulan / Root Cause
**Root cause #1 (terkonfirmasi runtime):** Kolom `is_archived` tidak ada di DB → query error → kanban kosong. Ini **pasti** menjadi masalah di project `qzsmtikhimbjowpvtjst`.

**Root cause #2 (jika user di project lain):** ada kemungkinan realtime/refresh tidak konsisten atau stage mismatch.

## Kesimpulan / Root Cause (TERKONFIRMASI)
**Root cause:** Kolom `is_archived` TIDAK ada di tabel `orders` pada Supabase project `qzsmtikhimbjowpvtjst`.
- `dashboard/page.tsx` (line 38) menjalankan `.eq('is_archived', false)`.
- PostgreSQL melempar error **42703** "column orders.is_archived does not exist".
- `data` menjadi `null` → fallback `orders || []` → **kanban selalu kosong**.
- Bukti: REST query `select=is_archived` → 42703; query tanpa kolom → 0 baris.
- Insert order berhasil karena `AddOrderModal` tidak menyentuh `is_archived` (default).

## Fix (DITERAPKAN)
Migration `supabase/migrations/add_is_archived_column.sql`:
```sql
alter table public.orders add column if not exists is_archived boolean not null default false;
create index if not exists orders_is_archived_idx on public.orders (is_archived);
```
Applied via MCP `supabase_apply_migration`. Verifikasi: kolom `is_archived` sekarang ordinal 40 di schema; query `.eq('is_archived', false)` mengembalikan 3 order (semua stage `customer_dp_desain`).

## Temuan Sekunder (SELESAI)
**Stage mismatch** antara kode dan DB CHECK constraint — sudah disinkronkan per keputusan user ("sesuaikan dengan yang di UI").
- Migration `supabase/migrations/sync_stage_constraint_to_ui.sql` applied.
- DB sekarang mengizinkan persis 10 stage UI, termasuk `proses_layout` & `cutting_jahit`.
- Stage lama (`cutting_bahan`, `jahit`, `quality_control`) dihapus dari constraint (tidak ada data yang memakainya, jadi aman).
- Verifikasi: order ke `proses_layout` → OK; dikembalikan ke `customer_dp_desain` → OK. Data final: 3 order, semua `customer_dp_desain`, `is_archived=false`.

## Status: MENUNGGU KONFIRMASI USER
User perlu verifikasi di browser (localhost:3000):
1. Buka /dashboard → 3 order harus muncul di kolom "Customer DP Desain".
2. Tambah order baru → harus langsung muncul di kanban.
3. Drag order ke kolom lain (termasuk Proses Layout / Cutting & Jahit) → harus berhasil.
