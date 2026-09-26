-- ===========================================
-- MIGRATION: Brand Logos Storage Bucket
-- Public bucket untuk logo brand (180x180, ringan)
-- ===========================================

-- Buat bucket publik untuk logo brand
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-logos',
    'brand-logos',
    TRUE,
    2097152, -- 2MB (logo di-resize ke 180x180 di client, jauh di bawah ini)
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- Kebijakan: user terautentikasi boleh upload
DROP POLICY IF EXISTS "brand-logos insert authenticated" ON storage.objects;
CREATE POLICY "brand-logos insert authenticated"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'brand-logos'
        AND auth.role() = 'authenticated'
    );

-- Kebijakan: user terautentikasi boleh update (upsert)
DROP POLICY IF EXISTS "brand-logos update authenticated" ON storage.objects;
CREATE POLICY "brand-logos update authenticated"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'brand-logos'
        AND auth.role() = 'authenticated'
    );

-- Kebijakan: siapa pun bisa baca (logo ditampilkan di PDF / UI)
DROP POLICY IF EXISTS "brand-logos public read" ON storage.objects;
CREATE POLICY "brand-logos public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-logos');

-- MIGRATION COMPLETE!
