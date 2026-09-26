-- ===========================================
-- MIGRATION: Order Assets Storage Bucket
-- Bucket untuk mockup desain & bukti pembayaran order
-- ===========================================

-- Buat bucket publik untuk aset order
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'order-assets',
    'order-assets',
    TRUE,
    52428800, -- 50MB (file desain bisa besar)
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Kebijakan: user terautentikasi boleh upload
DROP POLICY IF EXISTS "order-assets insert authenticated" ON storage.objects;
CREATE POLICY "order-assets insert authenticated"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'order-assets'
        AND auth.role() = 'authenticated'
    );

-- Kebijakan: user terautentikasi boleh update (upsert)
DROP POLICY IF EXISTS "order-assets update authenticated" ON storage.objects;
CREATE POLICY "order-assets update authenticated"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'order-assets'
        AND auth.role() = 'authenticated'
    );

-- Kebijakan: siapa pun bisa baca (mockup ditampilkan di UI / PDF)
DROP POLICY IF EXISTS "order-assets public read" ON storage.objects;
CREATE POLICY "order-assets public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'order-assets');

-- Kebijakan: user terautentikasi boleh hapus
DROP POLICY IF EXISTS "order-assets delete authenticated" ON storage.objects;
CREATE POLICY "order-assets delete authenticated"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'order-assets'
        AND auth.role() = 'authenticated'
    );

-- MIGRATION COMPLETE!
