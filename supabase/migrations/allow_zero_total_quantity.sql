-- Izinkan total_quantity = 0 pada orders.
-- Sebelumnya: CHECK (total_quantity > 0) menolak order baru yang dibuat dengan
-- total_quantity = 0 (diisi belakangan saat size_breakdown ditentukan).
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_total_quantity_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_total_quantity_check CHECK (total_quantity >= 0);
