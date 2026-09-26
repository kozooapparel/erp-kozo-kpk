-- Add is_archived column to orders table
-- Kode aplikasi (dashboard/page.tsx, OrderCard, dll) memfilter order dengan is_archived.
-- Kolom ini belum ada di database sehingga query kanban error (42703) dan kanban selalu kosong.
alter table public.orders
    add column if not exists is_archived boolean not null default false;

-- Indeks untuk mempercepat filter kanban
create index if not exists orders_is_archived_idx on public.orders (is_archived);
