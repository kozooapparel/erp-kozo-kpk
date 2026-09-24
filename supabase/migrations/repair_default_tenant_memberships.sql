-- Pastikan setiap profil lama dan baru memiliki membership tenant default.

INSERT INTO public.tenants (slug, name)
VALUES ('legacy-default', 'KOZO')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO public.tenant_memberships (tenant_id, user_id, is_default)
SELECT t.id, p.id, TRUE
FROM public.profiles AS p
CROSS JOIN public.tenants AS t
WHERE t.slug = 'legacy-default'
  AND NOT EXISTS (
      SELECT 1
      FROM public.tenant_memberships AS tm
      WHERE tm.user_id = p.id
        AND tm.is_default
  );

CREATE OR REPLACE FUNCTION public.assign_new_profile_to_default_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.tenant_memberships (tenant_id, user_id, is_default)
    SELECT t.id, NEW.id, TRUE
    FROM public.tenants AS t
    WHERE t.slug = 'legacy-default'
      AND NOT EXISTS (
          SELECT 1
          FROM public.tenant_memberships AS tm
          WHERE tm.user_id = NEW.id
            AND tm.is_default
      );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_new_profile_default_tenant ON public.profiles;
CREATE TRIGGER assign_new_profile_default_tenant
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_new_profile_to_default_tenant();
    