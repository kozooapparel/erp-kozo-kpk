-- ===========================================
-- MIGRATION: Pemisahan Master Barang per Brand
-- ===========================================

-- 1. Tambah kolom brand_id ke barang
ALTER TABLE public.barang
    ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- 2. Backfill barang lama ke brand RAIDWEAR (fallback: brand default)
UPDATE public.barang
SET brand_id = COALESCE(
    (SELECT id FROM public.brands WHERE code = 'RAI' LIMIT 1),
    (SELECT id FROM public.brands WHERE is_default = TRUE LIMIT 1)
)
WHERE brand_id IS NULL;

-- 3. Wajibkan brand_id
ALTER TABLE public.barang
    ALTER COLUMN brand_id SET NOT NULL;

-- 4. Index untuk query per brand
CREATE INDEX IF NOT EXISTS idx_barang_brand ON public.barang(brand_id);

-- 5. Guard: invoice_items tidak boleh pakai barang dari brand lain
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
