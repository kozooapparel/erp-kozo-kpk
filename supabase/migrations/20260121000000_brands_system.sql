-- ===========================================
-- MIGRATION: Multi-Brand System
-- ERP Kozo KPK - 21 January 2026
-- ===========================================

-- =====================
-- 1. TABEL BRANDS (Master Brand)
-- =====================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,              -- 'KZO', 'ALU', 'RAI'
    name TEXT NOT NULL,                     -- 'Kozoo Apparel'
    
    -- Company Info
    company_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,                          -- Cloudinary or Storage URL
    
    -- Bank Info
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    
    -- PDF Customization
    primary_color TEXT DEFAULT '#1e293b',
    accent_color TEXT DEFAULT '#f97316',
    
    -- Document Prefixes
    invoice_prefix TEXT NOT NULL DEFAULT 'INV',
    kuitansi_prefix TEXT NOT NULL DEFAULT 'KWT',
    spk_prefix TEXT NOT NULL DEFAULT 'SPK',
    
    -- Counters (per brand)
    invoice_counter INT DEFAULT 0,
    kuitansi_counter INT DEFAULT 0,
    spk_counter INT DEFAULT 0,
    
    -- Flags
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk brands
CREATE INDEX IF NOT EXISTS idx_brands_code ON public.brands(code);
CREATE INDEX IF NOT EXISTS idx_brands_active ON public.brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_default ON public.brands(is_default) WHERE is_default = TRUE;

-- Trigger updated_at untuk brands
CREATE TRIGGER on_brands_updated
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 2. ADD BRAND_ID TO ORDERS
-- =====================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Index untuk brand_id di orders
CREATE INDEX IF NOT EXISTS idx_orders_brand ON public.orders(brand_id);

-- =====================
-- 3. ADD BRAND_ID TO INVOICES
-- =====================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Index untuk brand_id di invoices
CREATE INDEX IF NOT EXISTS idx_invoices_brand ON public.invoices(brand_id);

-- =====================
-- 4. INSERT DEFAULT BRANDS
-- =====================

-- Brand 1: Kozoo Apparel (Default)
INSERT INTO public.brands (
    code, name, company_name, address, phone, 
    logo_url, 
    bank_name, account_name, account_number,
    invoice_prefix, kuitansi_prefix, spk_prefix,
    is_default
) VALUES (
    'KZO', 
    'Kozoo Apparel', 
    'Kozoo Apparel',
    'Kp Cibangkonol RT 01/19 Kec. Cibiru Wetan (belakang kantor desa) Kab. Bandung',
    '0899 9909 782',
    'https://res.cloudinary.com/dxfxcwtvt/image/upload/v1768997322/Untitled_design_1_hpgdug.png',
    'CIMB Niaga Syariah',
    'Agung Saputra',
    '761-3831-50000',
    'KZO', 'KZO', 'SPK-KZO',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Brand 2: Alus Factory
INSERT INTO public.brands (
    code, name, company_name, address, phone, 
    logo_url, 
    bank_name, account_name, account_number,
    invoice_prefix, kuitansi_prefix, spk_prefix
) VALUES (
    'ALU', 
    'Alus Factory', 
    'Alus Factory',
    NULL, -- Update later via UI
    NULL, -- Update later via UI
    'https://res.cloudinary.com/dxfxcwtvt/image/upload/v1768231621/af.logo_tlf7fw.png',
    NULL, -- Update later via UI
    NULL, -- Update later via UI
    NULL, -- Update later via UI
    'ALU', 'ALU', 'SPK-ALU'
) ON CONFLICT (code) DO NOTHING;

-- Brand 3: Raidwear
INSERT INTO public.brands (
    code, name, company_name, address, phone, 
    logo_url, 
    bank_name, account_name, account_number,
    invoice_prefix, kuitansi_prefix, spk_prefix
) VALUES (
    'RAI', 
    'Raidwear', 
    'Raidwear',
    NULL, -- Update later via UI
    NULL, -- Update later via UI
    'https://res.cloudinary.com/dxfxcwtvt/image/upload/v1768997971/Desain_tanpa_judul_1_xuvjrd.png',
    NULL, -- Update later via UI
    NULL, -- Update later via UI
    NULL, -- Update later via UI
    'RAI', 'RAI', 'SPK-RAI'
) ON CONFLICT (code) DO NOTHING;

-- =====================
-- 5. MIGRATE EXISTING ORDERS TO DEFAULT BRAND
-- =====================
UPDATE public.orders 
SET brand_id = (SELECT id FROM public.brands WHERE is_default = TRUE LIMIT 1)
WHERE brand_id IS NULL;

-- =====================
-- 6. MIGRATE EXISTING INVOICES TO DEFAULT BRAND
-- =====================
UPDATE public.invoices 
SET brand_id = (SELECT id FROM public.brands WHERE is_default = TRUE LIMIT 1)
WHERE brand_id IS NULL;

-- =====================
-- 7. ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Policies untuk brands
CREATE POLICY "Authenticated users can view brands"
    ON public.brands FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert brands"
    ON public.brands FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update brands"
    ON public.brands FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete brands"
    ON public.brands FOR DELETE
    USING (auth.role() = 'authenticated');

-- =====================
-- 8. FUNCTION: Increment Counter
-- =====================
CREATE OR REPLACE FUNCTION public.increment_brand_counter(
    p_brand_id UUID,
    p_counter_type TEXT  -- 'invoice', 'kuitansi', 'spk'
)
RETURNS INT AS $$
DECLARE
    v_new_counter INT;
BEGIN
    IF p_counter_type = 'invoice' THEN
        UPDATE public.brands 
        SET invoice_counter = invoice_counter + 1
        WHERE id = p_brand_id
        RETURNING invoice_counter INTO v_new_counter;
    ELSIF p_counter_type = 'kuitansi' THEN
        UPDATE public.brands 
        SET kuitansi_counter = kuitansi_counter + 1
        WHERE id = p_brand_id
        RETURNING kuitansi_counter INTO v_new_counter;
    ELSIF p_counter_type = 'spk' THEN
        UPDATE public.brands 
        SET spk_counter = spk_counter + 1
        WHERE id = p_brand_id
        RETURNING spk_counter INTO v_new_counter;
    ELSE
        RAISE EXCEPTION 'Invalid counter type: %', p_counter_type;
    END IF;
    
    RETURN v_new_counter;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- MIGRATION COMPLETE!
-- =====================
