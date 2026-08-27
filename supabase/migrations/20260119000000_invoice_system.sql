-- ===========================================
-- MIGRATION: Invoice & Receipt System
-- ERP Kozo KPK - 19 January 2026
-- ===========================================

-- =====================
-- 1. MODIFY CUSTOMERS TABLE (Add alamat & kota)
-- =====================
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS kota TEXT;

-- =====================
-- 2. TABEL BARANG (Master Produk)
-- =====================
CREATE TABLE IF NOT EXISTS public.barang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_barang TEXT NOT NULL,
    satuan TEXT NOT NULL DEFAULT 'PCS',
    harga_satuan NUMERIC(12,2) NOT NULL DEFAULT 0,
    kategori TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk barang
CREATE INDEX IF NOT EXISTS idx_barang_nama ON public.barang(nama_barang);
CREATE INDEX IF NOT EXISTS idx_barang_active ON public.barang(is_active);

-- Trigger updated_at untuk barang
CREATE TRIGGER on_barang_updated
    BEFORE UPDATE ON public.barang
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 3. TABEL BARANG_HARGA_TIER (Harga Berdasarkan Quantity)
-- =====================
CREATE TABLE IF NOT EXISTS public.barang_harga_tier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barang_id UUID NOT NULL REFERENCES public.barang(id) ON DELETE CASCADE,
    min_qty INT NOT NULL,
    max_qty INT, -- NULL = unlimited (e.g., 1000+)
    harga NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk harga tier
CREATE INDEX IF NOT EXISTS idx_harga_tier_barang ON public.barang_harga_tier(barang_id);

-- =====================
-- 4. TABEL APP_SETTINGS (Konfigurasi Aplikasi)
-- =====================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO public.app_settings (key, value) VALUES 
    ('bank_info', '{"bank_name": "CIMB Niaga Syariah", "account_name": "Agung Saputra", "account_number": "761-3831-50000"}'),
    ('company_info', '{"name": "Kozo KPK", "address": "Kp Cibangkonol RT 01/19 Kec. Cibiru Wetan (belakang kantor desa) Kab. Bandung", "phone": "0899 9909 782"}')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- 5. TABEL INVOICES (Header Invoice)
-- =====================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_invoice TEXT NOT NULL UNIQUE, -- Format: INV/YYMMDD/CustomerName
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- References
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Optional link ke Order Kanban
    
    -- Invoice Details
    perkiraan_produksi INT, -- Dalam hari
    deadline DATE,
    termin_pembayaran INT DEFAULT 16, -- Hari
    no_po TEXT, -- Nomor PO dari customer (optional)
    
    -- Amounts
    sub_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    ppn_persen NUMERIC(5,2) DEFAULT 0, -- 0 atau 11
    ppn_amount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    -- Payment Tracking (calculated from kuitansi)
    total_dibayar NUMERIC(12,2) DEFAULT 0,
    sisa_tagihan NUMERIC(12,2) DEFAULT 0,
    status_pembayaran TEXT DEFAULT 'BELUM_LUNAS' CHECK (status_pembayaran IN ('BELUM_LUNAS', 'SUDAH_LUNAS')),
    
    -- Audit
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes untuk invoices
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tanggal ON public.invoices(tanggal);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status_pembayaran);
CREATE INDEX IF NOT EXISTS idx_invoices_no ON public.invoices(no_invoice);

-- Trigger updated_at untuk invoices
CREATE TRIGGER on_invoices_updated
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- 6. TABEL INVOICE_ITEMS (Detail Item Invoice)
-- =====================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_no INT NOT NULL, -- Urutan 1, 2, 3...
    
    -- Item Details
    barang_id UUID REFERENCES public.barang(id) ON DELETE SET NULL, -- Optional, bisa NULL untuk custom item
    deskripsi TEXT NOT NULL,
    jumlah INT NOT NULL,
    satuan TEXT NOT NULL DEFAULT 'PCS',
    harga_satuan NUMERIC(12,2) NOT NULL,
    sub_total NUMERIC(12,2) NOT NULL, -- jumlah × harga_satuan
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_barang ON public.invoice_items(barang_id);

-- =====================
-- 7. TABEL KUITANSI (Bukti Pembayaran)
-- =====================
CREATE TABLE IF NOT EXISTS public.kuitansi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_kuitansi SERIAL, -- Auto-increment
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Reference
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    
    -- Payment Details
    jumlah NUMERIC(12,2) NOT NULL,
    keterangan TEXT, -- Auto: "Pembayaran invoice no: XXX"
    lokasi TEXT DEFAULT 'Bandung',
    
    -- Audit
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk kuitansi
CREATE INDEX IF NOT EXISTS idx_kuitansi_invoice ON public.kuitansi(invoice_id);
CREATE INDEX IF NOT EXISTS idx_kuitansi_tanggal ON public.kuitansi(tanggal);

-- =====================
-- 8. FUNCTION: Update Invoice Payment Status
-- =====================
CREATE OR REPLACE FUNCTION public.update_invoice_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total_dibayar NUMERIC(12,2);
    v_total NUMERIC(12,2);
BEGIN
    -- Get the invoice_id based on operation type
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(jumlah), 0) INTO v_total_dibayar
    FROM public.kuitansi 
    WHERE invoice_id = v_invoice_id;
    
    -- Get invoice total
    SELECT total INTO v_total
    FROM public.invoices
    WHERE id = v_invoice_id;
    
    -- Update invoice payment fields
    UPDATE public.invoices
    SET 
        total_dibayar = v_total_dibayar,
        sisa_tagihan = v_total - v_total_dibayar,
        status_pembayaran = CASE 
            WHEN v_total <= v_total_dibayar THEN 'SUDAH_LUNAS' 
            ELSE 'BELUM_LUNAS' 
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update invoice payment status
DROP TRIGGER IF EXISTS on_kuitansi_insert ON public.kuitansi;
DROP TRIGGER IF EXISTS on_kuitansi_update ON public.kuitansi;
DROP TRIGGER IF EXISTS on_kuitansi_delete ON public.kuitansi;

CREATE TRIGGER on_kuitansi_insert
    AFTER INSERT ON public.kuitansi
    FOR EACH ROW
    EXECUTE FUNCTION public.update_invoice_payment();

CREATE TRIGGER on_kuitansi_update
    AFTER UPDATE ON public.kuitansi
    FOR EACH ROW
    EXECUTE FUNCTION public.update_invoice_payment();

CREATE TRIGGER on_kuitansi_delete
    AFTER DELETE ON public.kuitansi
    FOR EACH ROW
    EXECUTE FUNCTION public.update_invoice_payment();

-- =====================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================

-- Enable RLS for new tables
ALTER TABLE public.barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barang_harga_tier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kuitansi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies untuk barang
CREATE POLICY "Authenticated users can view barang"
    ON public.barang FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create barang"
    ON public.barang FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update barang"
    ON public.barang FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete barang"
    ON public.barang FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policies untuk barang_harga_tier
CREATE POLICY "Authenticated users can view barang_harga_tier"
    ON public.barang_harga_tier FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create barang_harga_tier"
    ON public.barang_harga_tier FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update barang_harga_tier"
    ON public.barang_harga_tier FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete barang_harga_tier"
    ON public.barang_harga_tier FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policies untuk invoices
CREATE POLICY "Authenticated users can view invoices"
    ON public.invoices FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update invoices"
    ON public.invoices FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete invoices"
    ON public.invoices FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policies untuk invoice_items
CREATE POLICY "Authenticated users can view invoice_items"
    ON public.invoice_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create invoice_items"
    ON public.invoice_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update invoice_items"
    ON public.invoice_items FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete invoice_items"
    ON public.invoice_items FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policies untuk kuitansi
CREATE POLICY "Authenticated users can view kuitansi"
    ON public.kuitansi FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create kuitansi"
    ON public.kuitansi FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update kuitansi"
    ON public.kuitansi FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete kuitansi"
    ON public.kuitansi FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policies untuk app_settings (view all, update owner only via backend)
CREATE POLICY "Authenticated users can view app_settings"
    ON public.app_settings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update app_settings"
    ON public.app_settings FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert app_settings"
    ON public.app_settings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =====================
-- MIGRATION COMPLETE!
-- =====================
