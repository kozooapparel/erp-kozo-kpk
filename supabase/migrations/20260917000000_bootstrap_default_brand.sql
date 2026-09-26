-- =====================================================================
-- Bootstrap identitas untuk deployment baru.
--
-- 20260918000000_secure_default_brand_identity.sql menuntut tepat satu
-- default brand aktif, tetapi tidak ada migrasi yang pernah menyisipkan
-- brand. Akibatnya proyek Supabase baru (alur fork) selalu abort di sana.
-- Migrasi ini menyiapkan tenant + satu default brand supaya preflight itu
-- bisa lolos.
--
-- Hanya menyisipkan brand bila tabel benar-benar kosong. Deployment lama
-- yang sudah punya data brand tetap dibiarkan, sehingga keputusan memilih
-- default brand secara manual (niat asli preflight) tidak diambil alih.
-- =====================================================================

DO $$
DECLARE
    v_tenant_id   uuid;
    v_brand_count integer;
BEGIN
    -- Tenant yang sama dengan yang dipakai 20260918020000_tenant_r2_storage.
    INSERT INTO public.tenants (slug, name)
    VALUES ('legacy-default', 'RAIDWEAR')
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'legacy-default';

    SELECT COUNT(*) INTO v_brand_count FROM public.brands;
    IF v_brand_count > 0 THEN
        RETURN;
    END IF;

    -- tenant_id wajib diisi eksplisit: trigger assign_brand_tenant_scope
    -- hanya menurunkannya dari current_tenant_id(), yang bergantung pada
    -- auth.uid() dan selalu NULL saat migrasi berjalan.
    INSERT INTO public.brands (code, name, company_name, tenant_id, is_default, is_active)
    VALUES ('RAI', 'RAIDWEAR', 'RAIDWEAR', v_tenant_id, TRUE, TRUE);
END $$;
