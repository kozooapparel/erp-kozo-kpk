-- ===========================================
-- MIGRATION: Pemisahan Master Barang per Brand
-- ===========================================
--
-- Idempoten dan sadar-brand. Pada deployment baru (tabel barang kosong) atau
-- DB yang kolom brand_id-nya sudah terisi, migrasi ini praktis no-op. Pada DB
-- lama yang master barang-nya masih dipakai bersama lintas brand, migrasi ini
-- memisahkannya lebih dulu sebelum memasang NOT NULL + trigger.
--
-- Urutan ini penting: backfill buta ke satu brand (mis. 'RAI') akan membuat
-- trigger check_invoice_item_brand memblokir pembuatan invoice brand lain,
-- karena invoice_items lama masih menunjuk barang yang sama.

-- 1. Tambah kolom brand_id ke barang
ALTER TABLE public.barang
    ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- 2. Barang yang hanya dipakai satu brand -> brand itu.
UPDATE public.barang b
SET brand_id = u.brand_id
FROM (
    SELECT ii.barang_id, (array_agg(i.brand_id))[1] AS brand_id
    FROM public.invoice_items ii
    JOIN public.invoices i ON i.id = ii.invoice_id
    WHERE ii.barang_id IS NOT NULL
      AND i.brand_id IS NOT NULL
    GROUP BY ii.barang_id
    HAVING COUNT(DISTINCT i.brand_id) = 1
) u
WHERE b.id = u.barang_id
  AND b.brand_id IS NULL;

-- 3. Barang yang dipakai lebih dari satu brand -> duplikat per brand.
--    Baris asli dipertahankan untuk brand pemakai terbesar (supaya mayoritas
--    invoice_items tidak perlu dipindah), lalu dibuat satu salinan untuk
--    setiap brand lain dan invoice_items milik brand itu diarahkan ke salinan.
DO $$
DECLARE
    r        RECORD;
    v_new_id uuid;
    v_brands uuid[];
    v_idx    integer;
BEGIN
    FOR r IN
        SELECT u.barang_id,
               array_agg(u.brand_id ORDER BY u.cnt DESC, u.brand_id) AS brands
        FROM (
            SELECT ii.barang_id, i.brand_id, COUNT(*) AS cnt
            FROM public.invoice_items ii
            JOIN public.invoices i ON i.id = ii.invoice_id
            WHERE ii.barang_id IS NOT NULL
              AND i.brand_id IS NOT NULL
            GROUP BY ii.barang_id, i.brand_id
        ) u
        GROUP BY u.barang_id
        HAVING COUNT(*) > 1
    LOOP
        v_brands := r.brands;

        UPDATE public.barang
        SET brand_id = v_brands[1]
        WHERE id = r.barang_id
          AND brand_id IS NULL;

        FOR v_idx IN 2 .. array_length(v_brands, 1) LOOP
            INSERT INTO public.barang
                (nama_barang, satuan, harga_satuan, kategori, is_active, brand_id, created_at)
            SELECT nama_barang, satuan, harga_satuan, kategori, is_active,
                   v_brands[v_idx], created_at
            FROM public.barang
            WHERE id = r.barang_id
            RETURNING id INTO v_new_id;

            INSERT INTO public.barang_harga_tier (barang_id, min_qty, max_qty, harga)
            SELECT v_new_id, min_qty, max_qty, harga
            FROM public.barang_harga_tier
            WHERE barang_id = r.barang_id;

            UPDATE public.invoice_items ii
            SET barang_id = v_new_id
            FROM public.invoices i
            WHERE ii.invoice_id = i.id
              AND ii.barang_id = r.barang_id
              AND i.brand_id = v_brands[v_idx];
        END LOOP;
    END LOOP;
END $$;

-- 4. Sisa barang (belum pernah dipakai invoice mana pun) -> brand default,
--    dengan fallback brand aktif pertama.
UPDATE public.barang
SET brand_id = COALESCE(
    (SELECT id FROM public.brands WHERE is_default AND is_active LIMIT 1),
    (SELECT id FROM public.brands WHERE is_active ORDER BY created_at, id LIMIT 1),
    (SELECT id FROM public.brands ORDER BY created_at, id LIMIT 1)
)
WHERE brand_id IS NULL;

-- 5. Wajibkan brand_id
ALTER TABLE public.barang
    ALTER COLUMN brand_id SET NOT NULL;

-- 6. Index untuk query per brand
CREATE INDEX IF NOT EXISTS idx_barang_brand ON public.barang(brand_id);

-- 7. Guard: invoice_items tidak boleh pakai barang dari brand lain
CREATE OR REPLACE FUNCTION public.check_invoice_item_brand()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_brand UUID;
    v_barang_brand UUID;
BEGIN
    IF NEW.barang_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT brand_id INTO v_invoice_brand FROM public.invoices WHERE id = NEW.invoice_id;
    SELECT brand_id INTO v_barang_brand FROM public.barang WHERE id = NEW.barang_id;

    IF v_invoice_brand IS NOT NULL AND v_barang_brand IS DISTINCT FROM v_invoice_brand THEN
        RAISE EXCEPTION 'Barang % bukan milik brand invoice ini', NEW.barang_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_item_brand ON public.invoice_items;
CREATE TRIGGER trg_invoice_item_brand
    BEFORE INSERT OR UPDATE ON public.invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.check_invoice_item_brand();
