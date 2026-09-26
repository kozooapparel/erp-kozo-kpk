-- Secure default-brand management and application identity.
-- This migration deliberately does not select or change an existing default brand.

-- A deployment with no or multiple active defaults must be fixed manually before
-- this migration can proceed. Choosing a default automatically could alter the
-- intended application identity.
DO $$
DECLARE
    total_default_count INTEGER;
    active_default_count INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE is_default),
        COUNT(*) FILTER (WHERE is_default AND is_active)
    INTO total_default_count, active_default_count
    FROM public.brands;

    IF total_default_count <> 1 OR active_default_count <> 1 THEN
        RAISE EXCEPTION
            'Migration aborted: expected exactly one active default brand, found % default brand(s) and % active default brand(s). Resolve the existing brand data manually before retrying.',
            total_default_count,
            active_default_count;
    END IF;
END
$$;

-- Enforce a single default brand at the database level. The preflight above
-- guarantees this can be created without modifying existing brand data.
DROP INDEX IF EXISTS public.idx_brands_default;
-- IF NOT EXISTS wajib: baseline_schema sudah membuat index bernama sama,
-- sehingga deployment baru gagal di sini bila index dibuat tanpa syarat.
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_single_default
    ON public.brands ((is_default))
    WHERE is_default;

-- Existing authenticated users may update their own profile. They must never
-- be able to promote themselves to owner through that policy.
CREATE OR REPLACE FUNCTION public.prevent_authenticated_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.role() = 'authenticated' AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Authenticated users cannot change their own role';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_authenticated_role_change();

-- A default brand may not be deactivated. This protects the active-default
-- invariant even if a server-side operation races with a default change.
CREATE OR REPLACE FUNCTION public.prevent_default_brand_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.is_default AND NOT NEW.is_active THEN
        RAISE EXCEPTION 'The default brand cannot be deactivated';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_default_brand_active ON public.brands;
CREATE TRIGGER protect_default_brand_active
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_default_brand_deactivation();

-- Atomically switches the active default. Direct writes to brands are denied
-- below, so this is the only application path for changing is_default.
CREATE OR REPLACE FUNCTION public.set_default_brand(p_brand_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_is_active BOOLEAN;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Owner access required';
    END IF;

    -- Serialize changes to the default brand across concurrent requests.
    PERFORM pg_advisory_xact_lock(hashtext('public.brands.default_brand'));

    SELECT is_active
    INTO target_is_active
    FROM public.brands
    WHERE id = p_brand_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Brand not found';
    END IF;

    IF NOT target_is_active THEN
        RAISE EXCEPTION 'Only an active brand can be the default';
    END IF;

    UPDATE public.brands
    SET is_default = FALSE
    WHERE is_default
      AND id <> p_brand_id;

    UPDATE public.brands
    SET is_default = TRUE
    WHERE id = p_brand_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_default_brand(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_default_brand(UUID) TO authenticated;

-- The legacy counter function also writes to brands. Keep it off the browser
-- path; the owner-verified server action invokes it with the service role.
REVOKE ALL ON FUNCTION public.increment_brand_counter(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_brand_counter(UUID, TEXT) TO service_role;

-- Brand records contain bank and company details. Keep direct read access for
-- authenticated business flows, but deny all direct writes. Owner-verified
-- server actions use the service-role client for create/edit/deactivate.
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON public.brands;
