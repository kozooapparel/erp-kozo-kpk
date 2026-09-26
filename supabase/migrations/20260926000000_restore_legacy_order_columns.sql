-- =====================================================================
-- Konvergensi DB lama ke skema final (baseline + migrasi terbaru).
--
-- Latar: riwayat supabase_migrations pada DB owner TIDAK dapat dipercaya
-- sebagai bukti DDL sudah dijalankan. Sejumlah versi (mis. 20260921000000
-- brand_document_templates) tercatat "applied" padahal kolomnya tidak ada.
-- Karena itu migrasi ini bersifat otoritatif dan menuliskan sendiri semua
-- delta yang diperlukan, alih-alih mengandalkan versi lama itu dijalankan.
--
-- Semua statement di bawah idempoten: aman dijalankan pada DB baru (yang
-- baselinenya sudah memuat kolom-kolom ini) maupun DB lama yang belum
-- pernah menerimanya.
-- =====================================================================

-- 1. Kolom orders untuk form order, layout, dan catatan produksi.
--    Dipakai antara lain oleh src/lib/form-order.ts dan updateDesignNotes
--    di src/lib/actions/orders.ts.
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS layout_url       text,
    ADD COLUMN IF NOT EXISTS size_breakdown   jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS production_notes text,
    ADD COLUMN IF NOT EXISTS spk_sections     jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS design_notes     text;

-- 2. Kolom attendance_logs yang diisi webhook perangkat bioclock/iclock.
ALTER TABLE public.attendance_logs
    ADD COLUMN IF NOT EXISTS device_sn text;

-- 3. production_specs: samakan default ke '{}' seperti DB live, supaya
--    baris baru selalu membawa objek kosong alih-alih NULL.
ALTER TABLE public.orders
    ALTER COLUMN production_specs SET DEFAULT '{}'::jsonb;

-- 4. is_archived: samakan menjadi NOT NULL DEFAULT false.
--    UPDATE di bawah wajib lebih dulu, agar SET NOT NULL tidak gagal pada
--    DB lama yang kolomnya masih nullable.
UPDATE public.orders SET is_archived = false WHERE is_archived IS NULL;
ALTER TABLE public.orders
    ALTER COLUMN is_archived SET DEFAULT false,
    ALTER COLUMN is_archived SET NOT NULL;

-- 5. Seragamkan nama index is_archived ke orders_is_archived_idx.
--    DB lama memakai idx_orders_is_archived dengan definisi yang identik.
DROP INDEX IF EXISTS public.idx_orders_is_archived;
CREATE INDEX IF NOT EXISTS orders_is_archived_idx ON public.orders USING btree (is_archived);

-- 6. Seragamkan urutan anggota orders_stage_check. DB lama menyimpan
--    proses_layout sebelum dp_produksi; himpunannya sama tapi teks
--    definisinya harus identik supaya skema benar-benar konvergen.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_stage_check;
ALTER TABLE public.orders
    ADD CONSTRAINT orders_stage_check
    CHECK (stage = ANY (ARRAY[
        'customer_dp_desain'::text,
        'proses_desain'::text,
        'dp_produksi'::text,
        'proses_layout'::text,
        'antrean_produksi'::text,
        'print_press'::text,
        'cutting_jahit'::text,
        'packing'::text,
        'pelunasan'::text,
        'pengiriman'::text
    ]));

-- 7. Buang sequence yatim spk_number_seq yang hanya ada di DB lama: tidak
--    pernah dibuat migrasi mana pun, bukan default kolom mana pun, dan tidak
--    dirujuk kode aplikasi. Dijaga agar tidak dihapus bila ternyata masih
--    punya dependensi.
DO $$
DECLARE
    v_oid oid := to_regclass('public.spk_number_seq');
BEGIN
    IF v_oid IS NULL THEN
        RETURN;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_depend WHERE refobjid = v_oid AND deptype IN ('a', 'i', 'n')) THEN
        RAISE NOTICE 'spk_number_seq masih punya dependensi, dibiarkan';
        RETURN;
    END IF;
    EXECUTE 'DROP SEQUENCE public.spk_number_seq';
END $$;

-- 8. Kolom template dokumen per brand. Versi 20260921000000
--    brand_document_templates sudah tercatat "applied" di DB owner tetapi
--    kolomnya tidak pernah benar-benar dibuat, sehingga DDL-nya diulang di
--    sini agar DB owner ikut konvergen.
ALTER TABLE public.brands
    ADD COLUMN IF NOT EXISTS invoice_template  text NOT NULL DEFAULT 'modern',
    ADD COLUMN IF NOT EXISTS kuitansi_template text NOT NULL DEFAULT 'formal';

ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_invoice_template_check;
ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_kuitansi_template_check;

ALTER TABLE public.brands
    ADD CONSTRAINT brands_invoice_template_check
        CHECK (invoice_template IN ('modern', 'minimal', 'bold')),
    ADD CONSTRAINT brands_kuitansi_template_check
        CHECK (kuitansi_template IN ('formal', 'minimal', 'compact'));

COMMENT ON COLUMN public.brands.invoice_template IS 'PDF invoice layout: modern, minimal, or bold';
COMMENT ON COLUMN public.brands.kuitansi_template IS 'PDF kuitansi layout: formal, minimal, or compact';
