-- Form Order Produksi: tambah kolom yang dibutuhkan modul Form Order pada tabel orders.
-- production_specs (JSONB) = wadah data form order (detail produk, kebutuhan produksi, gambar kerah/mockup/list order).
-- nama_po / spk_number = identitas dokumen form order.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS production_specs JSONB,
    ADD COLUMN IF NOT EXISTS nama_po TEXT,
    ADD COLUMN IF NOT EXISTS spk_number TEXT;
