-- Sinkronkan CHECK constraint stage tabel orders agar sesuai dengan stage yang dipakai UI (STAGES_ORDER di kode).
-- UI memakai: customer_dp_desain, proses_desain, dp_produksi, proses_layout, antrean_produksi,
--             print_press, cutting_jahit, packing, pelunasan, pengiriman
-- DB lama masih mengizinkan: cutting_bahan, jahit, quality_control (tidak dipakai UI).

do $$
declare
    v_constraint_name text;
begin
    -- Cari nama CHECK constraint yang me-constraint kolom stage
    select con.conname
      into v_constraint_name
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where rel.relname = 'orders'
       and nsp.nspname = 'public'
       and con.contype = 'c'
       and con.conkey = (select array_agg(attnum) from pg_attribute
                          where attrelid = con.conrelid and attname = 'stage')
     limit 1;

    -- Hapus constraint lama jika ada
    if v_constraint_name is not null then
        execute format('alter table public.orders drop constraint %I', v_constraint_name);
    end if;
end $$;

-- Tambahkan CHECK constraint baru sesuai stage UI
alter table public.orders
    add constraint orders_stage_check
    check (stage = ANY (ARRAY[
        'customer_dp_desain'::text,
        'proses_desain'::text,
        'dp_produksi'::text,
        'proses_layout'::text,
        'antrean_produksi'::text,
        'print_press'::text,
        'cutting_jahit'::text,
        'packing'::text,
        'pelunasan'::text,
        'pengiriman'::text
    ]));
