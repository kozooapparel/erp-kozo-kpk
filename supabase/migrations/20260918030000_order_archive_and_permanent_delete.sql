-- Keep the existing is_archived flag as the canonical archive state.  The
-- operation below deliberately deletes only rows owned by the selected order;
-- customer, brand, user, and product/master rows are never touched.

CREATE OR REPLACE FUNCTION public.delete_order_permanently(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_invoice_ids UUID[];
BEGIN
    SELECT tenant_id
    INTO v_tenant_id
    FROM public.orders
    WHERE id = p_order_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Order tidak ditemukan';
    END IF;

    IF NOT public.has_tenant_access(v_tenant_id) THEN
        RAISE EXCEPTION 'Anda tidak memiliki akses untuk menghapus order ini';
    END IF;

    -- This should be impossible because r2_files is tenant-validated, but it
    -- prevents a cross-tenant delete if legacy data is inconsistent.
    IF EXISTS (
        SELECT 1
        FROM public.r2_files
        WHERE order_id = p_order_id
          AND tenant_id IS DISTINCT FROM v_tenant_id
    ) THEN
        RAISE EXCEPTION 'File order memiliki tenant yang tidak konsisten; penghapusan dihentikan';
    END IF;

    SELECT COALESCE(array_agg(id), ARRAY[]::UUID[])
    INTO v_invoice_ids
    FROM public.invoices
    WHERE order_id = p_order_id;

    -- Kuitansi must be removed before invoices because its FK is RESTRICT.
    DELETE FROM public.kuitansi
    WHERE invoice_id = ANY(v_invoice_ids);

    -- Delete explicitly rather than relying on invoice_items' cascade, so the
    -- owned records cleaned by this operation are unambiguous.
    DELETE FROM public.invoice_items
    WHERE invoice_id = ANY(v_invoice_ids);

    DELETE FROM public.invoices
    WHERE order_id = p_order_id;

    -- Objects in R2 are removed by the server action first.  Only their scoped
    -- metadata is removed here after object deletion has succeeded.
    DELETE FROM public.r2_files
    WHERE order_id = p_order_id
      AND tenant_id = v_tenant_id;

    DELETE FROM public.orders
    WHERE id = p_order_id
      AND tenant_id = v_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_order_permanently(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_order_permanently(UUID) TO authenticated, service_role;
