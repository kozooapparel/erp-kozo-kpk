-- Add selectable document layouts per brand.
-- Existing brands keep the modern/formal defaults through column defaults.
ALTER TABLE public.brands
    ADD COLUMN IF NOT EXISTS invoice_template TEXT NOT NULL DEFAULT 'modern',
    ADD COLUMN IF NOT EXISTS kuitansi_template TEXT NOT NULL DEFAULT 'formal';

ALTER TABLE public.brands
    DROP CONSTRAINT IF EXISTS brands_invoice_template_check,
    DROP CONSTRAINT IF EXISTS brands_kuitansi_template_check;

ALTER TABLE public.brands
    ADD CONSTRAINT brands_invoice_template_check
        CHECK (invoice_template IN ('modern', 'minimal', 'bold')),
    ADD CONSTRAINT brands_kuitansi_template_check
        CHECK (kuitansi_template IN ('formal', 'minimal', 'compact'));

COMMENT ON COLUMN public.brands.invoice_template IS 'PDF invoice layout: modern, minimal, or bold';
COMMENT ON COLUMN public.brands.kuitansi_template IS 'PDF kuitansi layout: formal, minimal, or compact';
