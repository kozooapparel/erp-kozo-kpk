-- Tenant-scoped Cloudflare R2 storage. Existing installations are migrated to
-- one legacy tenant; this intentionally does not alter order stages or files.

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_memberships_one_default_per_user
    ON public.tenant_memberships(user_id) WHERE is_default;
CREATE INDEX IF NOT EXISTS tenant_memberships_user_id_idx
    ON public.tenant_memberships(user_id);

INSERT INTO public.tenants (slug, name)
VALUES ('legacy-default', 'RAIDWEAR')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tenant_memberships (tenant_id, user_id, is_default)
SELECT t.id, p.id, TRUE
FROM public.profiles p
CROSS JOIN public.tenants t
WHERE t.slug = 'legacy-default'
ON CONFLICT (tenant_id, user_id) DO UPDATE SET is_default = TRUE;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id
    FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND is_default
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.tenant_memberships
        WHERE tenant_id = p_tenant_id AND user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_tenant_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_tenant_access(UUID) TO authenticated, service_role;

-- All existing brands and orders belong to the legacy tenant. New records are
-- assigned from the authenticated user's default tenant by triggers below.
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

UPDATE public.brands
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'legacy-default')
WHERE tenant_id IS NULL;
UPDATE public.orders
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'legacy-default')
WHERE tenant_id IS NULL;

ALTER TABLE public.brands ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS brands_tenant_id_idx ON public.brands(tenant_id);
CREATE INDEX IF NOT EXISTS orders_tenant_id_idx ON public.orders(tenant_id);

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

    IF TG_TABLE_NAME = 'orders' AND NEW.brand_id IS NOT NULL THEN
        SELECT tenant_id INTO v_brand_tenant FROM public.brands WHERE id = NEW.brand_id;
        IF v_brand_tenant IS NULL OR v_brand_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Order brand must belong to the same tenant';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_brand_tenant_scope ON public.brands;
CREATE TRIGGER assign_brand_tenant_scope
    BEFORE INSERT OR UPDATE OF tenant_id ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.assign_and_validate_tenant_scope();

DROP TRIGGER IF EXISTS assign_order_tenant_scope ON public.orders;
CREATE TRIGGER assign_order_tenant_scope
    BEFORE INSERT OR UPDATE OF tenant_id, brand_id ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.assign_and_validate_tenant_scope();

-- One encrypted R2 connection per tenant. Access-key material has no direct
-- browser policy; only the server service-role client may read it after auth.
CREATE TABLE IF NOT EXISTS public.tenant_r2_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    storage_limit_bytes BIGINT CHECK (storage_limit_bytes IS NULL OR storage_limit_bytes > 0),
    access_key_id_ciphertext TEXT NOT NULL,
    secret_access_key_ciphertext TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER on_tenant_r2_connections_updated
    BEFORE UPDATE ON public.tenant_r2_connections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Supabase stores only metadata and an encrypted credential envelope; binary
-- object data remains private in R2.
CREATE TABLE IF NOT EXISTS public.r2_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    storage_key TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    content_type TEXT,
    size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
    e_tag TEXT,
    r2_version_id TEXT,
    status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'missing', 'deleted', 'failed')),
    multipart_upload_id TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    cleanup_eligible_at TIMESTAMPTZ,
    cleanup_status TEXT NOT NULL DEFAULT 'none' CHECK (cleanup_status IN ('none', 'eligible', 'processing', 'deleted', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS r2_files_tenant_created_idx ON public.r2_files(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS r2_files_order_idx ON public.r2_files(order_id);
CREATE INDEX IF NOT EXISTS r2_files_cleanup_idx ON public.r2_files(cleanup_status, cleanup_eligible_at)
    WHERE status = 'ready';

CREATE OR REPLACE FUNCTION public.r2_storage_summary(p_tenant_id UUID)
RETURNS TABLE (used_bytes BIGINT, file_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(size_bytes), 0)::BIGINT, COUNT(*)::BIGINT
    FROM public.r2_files
    WHERE tenant_id = p_tenant_id AND status = 'ready';
$$;

REVOKE ALL ON FUNCTION public.r2_storage_summary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.r2_storage_summary(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.validate_r2_file_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_brand_tenant UUID;
    v_order_tenant UUID;
    v_order_brand UUID;
BEGIN
    SELECT tenant_id INTO v_brand_tenant FROM public.brands WHERE id = NEW.brand_id;
    IF v_brand_tenant IS NULL OR v_brand_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'R2 file brand must belong to the same tenant';
    END IF;

    IF NEW.order_id IS NOT NULL THEN
        SELECT tenant_id, brand_id INTO v_order_tenant, v_order_brand FROM public.orders WHERE id = NEW.order_id;
        IF v_order_tenant IS NULL OR v_order_tenant <> NEW.tenant_id OR v_order_brand IS DISTINCT FROM NEW.brand_id THEN
            RAISE EXCEPTION 'R2 file order and brand must belong to the same tenant';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_r2_file_tenant_scope
    BEFORE INSERT OR UPDATE OF tenant_id, brand_id, order_id ON public.r2_files
    FOR EACH ROW EXECUTE FUNCTION public.validate_r2_file_scope();

CREATE TRIGGER on_r2_files_updated
    BEFORE UPDATE ON public.r2_files
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_r2_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.r2_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant" ON public.tenants FOR SELECT
    USING (public.has_tenant_access(id));
CREATE POLICY "Users can view own tenant memberships" ON public.tenant_memberships FOR SELECT
    USING (user_id = auth.uid());
CREATE POLICY "Users can view R2 metadata in their tenant" ON public.r2_files FOR SELECT
    USING (public.has_tenant_access(tenant_id));

-- Explicitly replace legacy broad policies so new brand/order queries are
-- tenant-scoped without changing any Kanban workflow.
DROP POLICY IF EXISTS "Authenticated users can view brands" ON public.brands;
CREATE POLICY "Users can view brands in their tenant" ON public.brands FOR SELECT
    USING (public.has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
CREATE POLICY "Users can view orders in their tenant" ON public.orders FOR SELECT
    USING (public.has_tenant_access(tenant_id));
CREATE POLICY "Users can create orders in their tenant" ON public.orders FOR INSERT
    WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY "Users can update orders in their tenant" ON public.orders FOR UPDATE
    USING (public.has_tenant_access(tenant_id))
    WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY "Users can delete orders in their tenant" ON public.orders FOR DELETE
    USING (public.has_tenant_access(tenant_id));

-- New users join the legacy/default tenant until a future tenant-management
-- flow assigns them elsewhere. It keeps the current single-company app working.
CREATE OR REPLACE FUNCTION public.assign_new_profile_to_default_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.tenant_memberships (tenant_id, user_id, is_default)
    SELECT id, NEW.id, TRUE FROM public.tenants WHERE slug = 'legacy-default'
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_new_profile_default_tenant ON public.profiles;
CREATE TRIGGER assign_new_profile_default_tenant
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_new_profile_to_default_tenant();
