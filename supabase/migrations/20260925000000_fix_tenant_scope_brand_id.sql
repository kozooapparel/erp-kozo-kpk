-- =====================================================================
-- Perbaiki trigger function yang membuat INSERT ke public.brands selalu
-- gagal dengan: record "new" has no field "brand_id".
--
-- assign_and_validate_tenant_scope() dipasang pada brands maupun orders.
-- Badannya mengakses NEW.brand_id, padahal kolom itu hanya ada di orders.
-- Guard `TG_TABLE_NAME = 'orders' AND NEW.brand_id IS NOT NULL` tidak
-- menolong karena PL/pgSQL me-resolve field record ketika mengompilasi
-- ekspresi, bukan ketika mengevaluasinya.
--
-- Definisi di baseline_schema dan di 20260918020000 sudah ikut dibetulkan
-- demi deployment baru. Migrasi ini diperlukan untuk deployment yang sudah
-- terlanjur menjalankan keduanya.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.assign_and_validate_tenant_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_brand_tenant UUID;
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := public.current_tenant_id();
    END IF;

    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'A default tenant membership is required';
    END IF;

    IF TG_TABLE_NAME = 'orders' THEN
        IF NEW.brand_id IS NOT NULL THEN
            SELECT tenant_id INTO v_brand_tenant FROM public.brands WHERE id = NEW.brand_id;
            IF v_brand_tenant IS NULL OR v_brand_tenant <> NEW.tenant_id THEN
                RAISE EXCEPTION 'Order brand must belong to the same tenant';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
