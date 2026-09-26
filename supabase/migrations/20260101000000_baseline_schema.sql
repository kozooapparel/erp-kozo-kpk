-- =====================================================================
-- BASELINE SCHEMA (squashed migrations)
-- ---------------------------------------------------------------------
-- Snapshot of the RAIDWEAR production schema (public schema only).
-- Replaces the legacy migrations 20260117..20260921, which were not
-- idempotent and did not describe the live schema (several columns had
-- been added by hand outside of any migration file).
--
-- Written to be fully idempotent, so it can be applied both to a brand
-- new database and to an existing installation.
--
-- Storage buckets/policies live in the followed bucket migrations, and
-- data seeds live in supabase/scripts/.
-- =====================================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
create extension if not exists "pg_stat_statements" with schema "extensions";
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "supabase_vault" with schema "vault";
create extension if not exists "uuid-ossp" with schema "extensions";

-- ----------------------------------------------------------------
-- Sequences
-- ----------------------------------------------------------------
create sequence if not exists public."kuitansi_no_kuitansi_seq" start with 1 increment by 1 minvalue 1 maxvalue 2147483647 cache 1;

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------
create table if not exists public."allowances" (
  "id" uuid default gen_random_uuid() not null,
  "employee_id" uuid not null,
  "allowance_type" text not null,
  "amount" numeric(12,2) not null,
  "calculation_method" text default 'per_day'::text not null,
  "is_active" boolean default true,
  "effective_from" date,
  "effective_to" date,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."app_settings" (
  "id" uuid default gen_random_uuid() not null,
  "key" text not null,
  "value" jsonb not null,
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."attendance_deficit_reports" (
  "id" uuid default gen_random_uuid() not null,
  "employee_id" uuid not null,
  "month" integer not null,
  "year" integer not null,
  "total_deficit_hours" numeric(10,2) default 0,
  "deficit_count" integer default 0,
  "report_sent_to_owner" boolean default false,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."attendance_logs" (
  "id" uuid default gen_random_uuid() not null,
  "employee_id" uuid not null,
  "date" date not null,
  "check_in" timestamp with time zone,
  "check_out" timestamp with time zone,
  "total_time_in_office" numeric(5,2),
  "break_time" numeric(5,2) default 1.0,
  "effective_hours" numeric(5,2),
  "overtime_hours" numeric(5,2) default 0,
  "deficit_hours" numeric(5,2) default 0,
  "forgot_checkout" boolean default false,
  "status" text not null,
  "method" text default 'fingerprint'::text not null,
  "notes" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "device_sn" text
);
create table if not exists public."barang" (
  "id" uuid default gen_random_uuid() not null,
  "nama_barang" text not null,
  "satuan" text default 'PCS'::text not null,
  "harga_satuan" numeric(12,2) default 0 not null,
  "kategori" text,
  "is_active" boolean default true,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "brand_id" uuid not null
);
create table if not exists public."barang_harga_tier" (
  "id" uuid default gen_random_uuid() not null,
  "barang_id" uuid not null,
  "min_qty" integer not null,
  "max_qty" integer,
  "harga" numeric(12,2) not null,
  "created_at" timestamp with time zone default now()
);
create table if not exists public."bonuses" (
  "id" uuid default gen_random_uuid() not null,
  "employee_id" uuid not null,
  "bonus_type" text not null,
  "amount" numeric(12,2) not null,
  "period_month" integer not null,
  "period_year" integer not null,
  "reason" text,
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "created_at" timestamp with time zone default now()
);
create table if not exists public."brands" (
  "id" uuid default gen_random_uuid() not null,
  "code" text not null,
  "name" text not null,
  "company_name" text not null,
  "address" text,
  "phone" text,
  "email" text,
  "logo_url" text,
  "bank_name" text,
  "account_name" text,
  "account_number" text,
  "primary_color" text default '#1e293b'::text,
  "accent_color" text default '#f97316'::text,
  "invoice_prefix" text default 'INV'::text not null,
  "kuitansi_prefix" text default 'KWT'::text not null,
  "spk_prefix" text default 'SPK'::text not null,
  "invoice_counter" integer default 0,
  "kuitansi_counter" integer default 0,
  "spk_counter" integer default 0,
  "is_default" boolean default false,
  "is_active" boolean default true,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "tenant_id" uuid not null,
  "default_invoice_template_id" text default 'invoice_01'::text not null,
  "default_kuitansi_template_id" text default 'receipt_01'::text not null,
  "secondary_color" text default '#334155'::text not null
);
create table if not exists public."customers" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "phone" text not null,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "alamat" text,
  "kota" text
);
create table if not exists public."deductions" (
  "id" uuid default gen_random_uuid() not null,
  "employee_id" uuid not null,
  "deduction_type" text default 'kasbon'::text not null,
  "total_amount" numeric(12,2) not null,
  "remaining_amount" numeric(12,2) not null,
  "installment_per_period" numeric(12,2) not null,
  "status" text default 'active'::text not null,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."employees" (
  "id" uuid default gen_random_uuid() not null,
  "nik" text not null,
  "full_name" text not null,
  "department" text not null,
  "position" text not null,
  "daily_rate" numeric(12,2) not null,
  "join_date" date not null,
  "status" text default 'active'::text not null,
  "bank_account" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."invoice_items" (
  "id" uuid default gen_random_uuid() not null,
  "invoice_id" uuid not null,
  "item_no" integer not null,
  "barang_id" uuid,
  "deskripsi" text not null,
  "jumlah" integer not null,
  "satuan" text default 'PCS'::text not null,
  "harga_satuan" numeric(12,2) not null,
  "sub_total" numeric(12,2) not null,
  "created_at" timestamp with time zone default now()
);
create table if not exists public."invoices" (
  "id" uuid default gen_random_uuid() not null,
  "no_invoice" text not null,
  "tanggal" date default CURRENT_DATE not null,
  "customer_id" uuid not null,
  "order_id" uuid,
  "perkiraan_produksi" integer,
  "deadline" date,
  "termin_pembayaran" integer default 16,
  "no_po" text,
  "sub_total" numeric(12,2) default 0 not null,
  "ppn_persen" numeric(5,2) default 0,
  "ppn_amount" numeric(12,2) default 0,
  "total" numeric(12,2) default 0 not null,
  "total_dibayar" numeric(12,2) default 0,
  "sisa_tagihan" numeric(12,2) default 0,
  "status_pembayaran" text default 'BELUM_LUNAS'::text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "brand_id" uuid,
  "template_id" text
);
create table if not exists public."kuitansi" (
  "id" uuid default gen_random_uuid() not null,
  "no_kuitansi" integer default nextval('kuitansi_no_kuitansi_seq'::regclass) not null,
  "tanggal" date default CURRENT_DATE not null,
  "invoice_id" uuid not null,
  "jumlah" numeric(12,2) not null,
  "keterangan" text,
  "lokasi" text default 'Bandung'::text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "template_id" text
);
create table if not exists public."orders" (
  "id" uuid default gen_random_uuid() not null,
  "customer_id" uuid not null,
  "total_quantity" integer not null,
  "order_description" text,
  "mockup_url" text,
  "deadline" date,
  "stage" text default 'customer_dp_desain'::text not null,
  "dp_desain_amount" numeric(12,2) default 0,
  "dp_desain_verified" boolean default false,
  "dp_desain_proof_url" text,
  "dp_desain_verified_at" timestamp with time zone,
  "dp_desain_verified_by" uuid,
  "dp_produksi_amount" numeric(12,2) default 0,
  "dp_produksi_verified" boolean default false,
  "dp_produksi_proof_url" text,
  "dp_produksi_verified_at" timestamp with time zone,
  "dp_produksi_verified_by" uuid,
  "pelunasan_amount" numeric(12,2) default 0,
  "pelunasan_verified" boolean default false,
  "pelunasan_proof_url" text,
  "pelunasan_verified_at" timestamp with time zone,
  "pelunasan_verified_by" uuid,
  "tracking_number" text,
  "shipped_at" timestamp with time zone,
  "stage_entered_at" timestamp with time zone default now(),
  "created_by" uuid,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "layout_completed" boolean default false,
  "production_ready" boolean default false,
  "print_completed" boolean default false,
  "sewing_completed" boolean default false,
  "packing_completed" boolean default false,
  "layout_completed_at" timestamp with time zone,
  "production_ready_at" timestamp with time zone,
  "print_completed_at" timestamp with time zone,
  "sewing_completed_at" timestamp with time zone,
  "packing_completed_at" timestamp with time zone,
  "brand_id" uuid,
  "is_archived" boolean default false not null,
  "production_specs" jsonb default '{}'::jsonb,
  "nama_po" text,
  "spk_number" text,
  "tenant_id" uuid not null,
  "layout_url" text,
  "size_breakdown" jsonb default '{}'::jsonb,
  "production_notes" text,
  "spk_sections" jsonb default '[]'::jsonb,
  "design_notes" text
);
create table if not exists public."payroll_entries" (
  "id" uuid default gen_random_uuid() not null,
  "period_id" uuid not null,
  "employee_id" uuid not null,
  "total_work_days" integer default 0 not null,
  "daily_rate" numeric(12,2) not null,
  "base_salary" numeric(12,2) default 0 not null,
  "total_allowances" numeric(12,2) default 0,
  "total_overtime" numeric(12,2) default 0,
  "total_bonuses" numeric(12,2) default 0,
  "gross_salary" numeric(12,2) default 0 not null,
  "total_deductions" numeric(12,2) default 0,
  "net_salary" numeric(12,2) default 0 not null,
  "allowance_breakdown" jsonb,
  "overtime_breakdown" jsonb,
  "bonus_breakdown" jsonb,
  "deduction_breakdown" jsonb,
  "printed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."payroll_periods" (
  "id" uuid default gen_random_uuid() not null,
  "period_name" text not null,
  "start_date" date not null,
  "end_date" date not null,
  "payment_date" date not null,
  "status" text default 'draft'::text not null,
  "generated_at" timestamp with time zone default now(),
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."profiles" (
  "id" uuid not null,
  "email" text not null,
  "full_name" text not null,
  "role" text default 'admin'::text not null,
  "avatar_url" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);
create table if not exists public."r2_files" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "brand_id" uuid not null,
  "order_id" uuid,
  "storage_key" text not null,
  "original_name" text not null,
  "content_type" text,
  "size_bytes" bigint default 0 not null,
  "e_tag" text,
  "r2_version_id" text,
  "status" text default 'uploading'::text not null,
  "multipart_upload_id" text,
  "uploaded_by" uuid,
  "uploaded_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "cleanup_eligible_at" timestamp with time zone,
  "cleanup_status" text default 'none'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table if not exists public."tenant_memberships" (
  "tenant_id" uuid not null,
  "user_id" uuid not null,
  "is_default" boolean default false not null,
  "created_at" timestamp with time zone default now() not null
);
create table if not exists public."tenant_r2_connections" (
  "id" uuid default gen_random_uuid() not null,
  "tenant_id" uuid not null,
  "account_id" text not null,
  "bucket_name" text not null,
  "endpoint" text not null,
  "storage_limit_bytes" bigint,
  "access_key_id_ciphertext" text not null,
  "secret_access_key_ciphertext" text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table if not exists public."tenants" (
  "id" uuid default gen_random_uuid() not null,
  "slug" text not null,
  "name" text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

-- ----------------------------------------------------------------
-- Sequence ownership
-- ----------------------------------------------------------------
alter sequence public."kuitansi_no_kuitansi_seq" owned by public."kuitansi"."no_kuitansi";

-- ----------------------------------------------------------------
-- Constraints
-- ----------------------------------------------------------------
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'allowances_allowance_type_check' and conrelid = 'public.allowances'::regclass) then
    alter table only public."allowances" add constraint "allowances_allowance_type_check" CHECK ((allowance_type = ANY (ARRAY['transport'::text, 'meal'::text, 'position'::text, 'other'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'allowances_amount_check' and conrelid = 'public.allowances'::regclass) then
    alter table only public."allowances" add constraint "allowances_amount_check" CHECK ((amount >= (0)::numeric));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'allowances_calculation_method_check' and conrelid = 'public.allowances'::regclass) then
    alter table only public."allowances" add constraint "allowances_calculation_method_check" CHECK ((calculation_method = ANY (ARRAY['per_day'::text, 'per_month'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'allowances_pkey' and conrelid = 'public.allowances'::regclass) then
    alter table only public."allowances" add constraint "allowances_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'app_settings_pkey' and conrelid = 'public.app_settings'::regclass) then
    alter table only public."app_settings" add constraint "app_settings_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'app_settings_key_key' and conrelid = 'public.app_settings'::regclass) then
    alter table only public."app_settings" add constraint "app_settings_key_key" UNIQUE (key);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_deficit_reports_month_check' and conrelid = 'public.attendance_deficit_reports'::regclass) then
    alter table only public."attendance_deficit_reports" add constraint "attendance_deficit_reports_month_check" CHECK (((month >= 1) AND (month <= 12)));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_deficit_reports_year_check' and conrelid = 'public.attendance_deficit_reports'::regclass) then
    alter table only public."attendance_deficit_reports" add constraint "attendance_deficit_reports_year_check" CHECK ((year >= 2020));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_deficit_reports_pkey' and conrelid = 'public.attendance_deficit_reports'::regclass) then
    alter table only public."attendance_deficit_reports" add constraint "attendance_deficit_reports_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_deficit_reports_employee_id_year_month_key' and conrelid = 'public.attendance_deficit_reports'::regclass) then
    alter table only public."attendance_deficit_reports" add constraint "attendance_deficit_reports_employee_id_year_month_key" UNIQUE (employee_id, year, month);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_logs_method_check' and conrelid = 'public.attendance_logs'::regclass) then
    alter table only public."attendance_logs" add constraint "attendance_logs_method_check" CHECK ((method = ANY (ARRAY['fingerprint'::text, 'manual'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_logs_status_check' and conrelid = 'public.attendance_logs'::regclass) then
    alter table only public."attendance_logs" add constraint "attendance_logs_status_check" CHECK ((status = ANY (ARRAY['present'::text, 'late'::text, 'absent'::text, 'leave'::text, 'sick'::text, 'holiday_overtime'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_logs_pkey' and conrelid = 'public.attendance_logs'::regclass) then
    alter table only public."attendance_logs" add constraint "attendance_logs_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_logs_employee_id_date_key' and conrelid = 'public.attendance_logs'::regclass) then
    alter table only public."attendance_logs" add constraint "attendance_logs_employee_id_date_key" UNIQUE (employee_id, date);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'barang_pkey' and conrelid = 'public.barang'::regclass) then
    alter table only public."barang" add constraint "barang_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'barang_harga_tier_pkey' and conrelid = 'public.barang_harga_tier'::regclass) then
    alter table only public."barang_harga_tier" add constraint "barang_harga_tier_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_amount_check' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_amount_check" CHECK ((amount > (0)::numeric));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_bonus_type_check' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_bonus_type_check" CHECK ((bonus_type = ANY (ARRAY['performance'::text, 'target'::text, 'project_completion'::text, 'other'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_period_month_check' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_period_month_check" CHECK (((period_month >= 1) AND (period_month <= 12)));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_period_year_check' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_period_year_check" CHECK ((period_year >= 2020));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_pkey' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'brands_pkey' and conrelid = 'public.brands'::regclass) then
    alter table only public."brands" add constraint "brands_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'brands_code_key' and conrelid = 'public.brands'::regclass) then
    alter table only public."brands" add constraint "brands_code_key" UNIQUE (code);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'customers_pkey' and conrelid = 'public.customers'::regclass) then
    alter table only public."customers" add constraint "customers_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'customers_phone_key' and conrelid = 'public.customers'::regclass) then
    alter table only public."customers" add constraint "customers_phone_key" UNIQUE (phone);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_deduction_type_check' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_deduction_type_check" CHECK ((deduction_type = ANY (ARRAY['kasbon'::text, 'other'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_installment_per_period_check' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_installment_per_period_check" CHECK ((installment_per_period > (0)::numeric));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_remaining_amount_check' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_remaining_amount_check" CHECK ((remaining_amount >= (0)::numeric));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_status_check' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paid_off'::text, 'cancelled'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_total_amount_check' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_total_amount_check" CHECK ((total_amount > (0)::numeric));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_pkey' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'employees_daily_rate_check' and conrelid = 'public.employees'::regclass) then
    alter table only public."employees" add constraint "employees_daily_rate_check" CHECK ((daily_rate > (0)::numeric));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'employees_department_check' and conrelid = 'public.employees'::regclass) then
    alter table only public."employees" add constraint "employees_department_check" CHECK ((department = ANY (ARRAY['Produksi'::text, 'QC'::text, 'Packing'::text, 'Admin'::text, 'Sales'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'employees_status_check' and conrelid = 'public.employees'::regclass) then
    alter table only public."employees" add constraint "employees_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'employees_pkey' and conrelid = 'public.employees'::regclass) then
    alter table only public."employees" add constraint "employees_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'employees_nik_key' and conrelid = 'public.employees'::regclass) then
    alter table only public."employees" add constraint "employees_nik_key" UNIQUE (nik);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoice_items_pkey' and conrelid = 'public.invoice_items'::regclass) then
    alter table only public."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_status_pembayaran_check' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_status_pembayaran_check" CHECK ((status_pembayaran = ANY (ARRAY['BELUM_LUNAS'::text, 'SUDAH_LUNAS'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_pkey' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_no_invoice_key' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_no_invoice_key" UNIQUE (no_invoice);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'kuitansi_pkey' and conrelid = 'public.kuitansi'::regclass) then
    alter table only public."kuitansi" add constraint "kuitansi_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_stage_check' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_stage_check" CHECK ((stage = ANY (ARRAY['customer_dp_desain'::text, 'proses_desain'::text, 'dp_produksi'::text, 'proses_layout'::text, 'antrean_produksi'::text, 'print_press'::text, 'cutting_jahit'::text, 'packing'::text, 'pelunasan'::text, 'pengiriman'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_total_quantity_check' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_total_quantity_check" CHECK ((total_quantity >= 0));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_pkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_entries_pkey' and conrelid = 'public.payroll_entries'::regclass) then
    alter table only public."payroll_entries" add constraint "payroll_entries_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_entries_period_id_employee_id_key' and conrelid = 'public.payroll_entries'::regclass) then
    alter table only public."payroll_entries" add constraint "payroll_entries_period_id_employee_id_key" UNIQUE (period_id, employee_id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_periods_status_check' and conrelid = 'public.payroll_periods'::regclass) then
    alter table only public."payroll_periods" add constraint "payroll_periods_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'paid'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_periods_pkey' and conrelid = 'public.payroll_periods'::regclass) then
    alter table only public."payroll_periods" add constraint "payroll_periods_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_periods_period_name_key' and conrelid = 'public.payroll_periods'::regclass) then
    alter table only public."payroll_periods" add constraint "payroll_periods_period_name_key" UNIQUE (period_name);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass) then
    alter table only public."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_pkey' and conrelid = 'public.profiles'::regclass) then
    alter table only public."profiles" add constraint "profiles_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_cleanup_status_check' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_cleanup_status_check" CHECK ((cleanup_status = ANY (ARRAY['none'::text, 'eligible'::text, 'processing'::text, 'deleted'::text, 'failed'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_size_bytes_check' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_size_bytes_check" CHECK ((size_bytes >= 0));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_status_check' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_status_check" CHECK ((status = ANY (ARRAY['uploading'::text, 'ready'::text, 'missing'::text, 'deleted'::text, 'failed'::text])));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_pkey' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_storage_key_key' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_storage_key_key" UNIQUE (storage_key);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_memberships_pkey' and conrelid = 'public.tenant_memberships'::regclass) then
    alter table only public."tenant_memberships" add constraint "tenant_memberships_pkey" PRIMARY KEY (tenant_id, user_id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_r2_connections_storage_limit_bytes_check' and conrelid = 'public.tenant_r2_connections'::regclass) then
    alter table only public."tenant_r2_connections" add constraint "tenant_r2_connections_storage_limit_bytes_check" CHECK (((storage_limit_bytes IS NULL) OR (storage_limit_bytes > 0)));
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_r2_connections_pkey' and conrelid = 'public.tenant_r2_connections'::regclass) then
    alter table only public."tenant_r2_connections" add constraint "tenant_r2_connections_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_r2_connections_tenant_id_key' and conrelid = 'public.tenant_r2_connections'::regclass) then
    alter table only public."tenant_r2_connections" add constraint "tenant_r2_connections_tenant_id_key" UNIQUE (tenant_id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenants_pkey' and conrelid = 'public.tenants'::regclass) then
    alter table only public."tenants" add constraint "tenants_pkey" PRIMARY KEY (id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenants_slug_key' and conrelid = 'public.tenants'::regclass) then
    alter table only public."tenants" add constraint "tenants_slug_key" UNIQUE (slug);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'allowances_employee_id_fkey' and conrelid = 'public.allowances'::regclass) then
    alter table only public."allowances" add constraint "allowances_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_deficit_reports_employee_id_fkey' and conrelid = 'public.attendance_deficit_reports'::regclass) then
    alter table only public."attendance_deficit_reports" add constraint "attendance_deficit_reports_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_logs_employee_id_fkey' and conrelid = 'public.attendance_logs'::regclass) then
    alter table only public."attendance_logs" add constraint "attendance_logs_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'barang_brand_id_fkey' and conrelid = 'public.barang'::regclass) then
    alter table only public."barang" add constraint "barang_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'barang_harga_tier_barang_id_fkey' and conrelid = 'public.barang_harga_tier'::regclass) then
    alter table only public."barang_harga_tier" add constraint "barang_harga_tier_barang_id_fkey" FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_approved_by_fkey' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'bonuses_employee_id_fkey' and conrelid = 'public.bonuses'::regclass) then
    alter table only public."bonuses" add constraint "bonuses_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'brands_tenant_id_fkey' and conrelid = 'public.brands'::regclass) then
    alter table only public."brands" add constraint "brands_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_created_by_fkey' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'deductions_employee_id_fkey' and conrelid = 'public.deductions'::regclass) then
    alter table only public."deductions" add constraint "deductions_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoice_items_barang_id_fkey' and conrelid = 'public.invoice_items'::regclass) then
    alter table only public."invoice_items" add constraint "invoice_items_barang_id_fkey" FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE SET NULL;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoice_items_invoice_id_fkey' and conrelid = 'public.invoice_items'::regclass) then
    alter table only public."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_brand_id_fkey' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_created_by_fkey' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_customer_id_fkey' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_order_id_fkey' and conrelid = 'public.invoices'::regclass) then
    alter table only public."invoices" add constraint "invoices_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'kuitansi_created_by_fkey' and conrelid = 'public.kuitansi'::regclass) then
    alter table only public."kuitansi" add constraint "kuitansi_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'kuitansi_invoice_id_fkey' and conrelid = 'public.kuitansi'::regclass) then
    alter table only public."kuitansi" add constraint "kuitansi_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_brand_id_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_created_by_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_customer_id_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_dp_desain_verified_by_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_dp_desain_verified_by_fkey" FOREIGN KEY (dp_desain_verified_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_dp_produksi_verified_by_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_dp_produksi_verified_by_fkey" FOREIGN KEY (dp_produksi_verified_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_pelunasan_verified_by_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_pelunasan_verified_by_fkey" FOREIGN KEY (pelunasan_verified_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_tenant_id_fkey' and conrelid = 'public.orders'::regclass) then
    alter table only public."orders" add constraint "orders_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_entries_employee_id_fkey' and conrelid = 'public.payroll_entries'::regclass) then
    alter table only public."payroll_entries" add constraint "payroll_entries_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_entries_period_id_fkey' and conrelid = 'public.payroll_entries'::regclass) then
    alter table only public."payroll_entries" add constraint "payroll_entries_period_id_fkey" FOREIGN KEY (period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_periods_approved_by_fkey' and conrelid = 'public.payroll_periods'::regclass) then
    alter table only public."payroll_periods" add constraint "payroll_periods_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES profiles(id);
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_id_fkey' and conrelid = 'public.profiles'::regclass) then
    alter table only public."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_brand_id_fkey' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_order_id_fkey' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_tenant_id_fkey' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'r2_files_uploaded_by_fkey' and conrelid = 'public.r2_files'::regclass) then
    alter table only public."r2_files" add constraint "r2_files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_memberships_tenant_id_fkey' and conrelid = 'public.tenant_memberships'::regclass) then
    alter table only public."tenant_memberships" add constraint "tenant_memberships_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_memberships_user_id_fkey' and conrelid = 'public.tenant_memberships'::regclass) then
    alter table only public."tenant_memberships" add constraint "tenant_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $do$;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_r2_connections_tenant_id_fkey' and conrelid = 'public.tenant_r2_connections'::regclass) then
    alter table only public."tenant_r2_connections" add constraint "tenant_r2_connections_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  end if;
end $do$;

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
create index if not exists idx_allowances_active ON public.allowances USING btree (is_active);
create index if not exists idx_allowances_employee ON public.allowances USING btree (employee_id);
create index if not exists idx_deficit_reports_employee ON public.attendance_deficit_reports USING btree (employee_id);
create index if not exists idx_deficit_reports_period ON public.attendance_deficit_reports USING btree (year, month);
create index if not exists idx_attendance_date ON public.attendance_logs USING btree (date);
create index if not exists idx_attendance_employee ON public.attendance_logs USING btree (employee_id);
create index if not exists idx_attendance_employee_date ON public.attendance_logs USING btree (employee_id, date);
create index if not exists idx_attendance_status ON public.attendance_logs USING btree (status);
create index if not exists idx_barang_active ON public.barang USING btree (is_active);
create index if not exists idx_barang_brand ON public.barang USING btree (brand_id);
create index if not exists idx_barang_nama ON public.barang USING btree (nama_barang);
create index if not exists idx_harga_tier_barang ON public.barang_harga_tier USING btree (barang_id);
create index if not exists idx_bonuses_employee ON public.bonuses USING btree (employee_id);
create index if not exists idx_bonuses_period ON public.bonuses USING btree (period_year, period_month);
create index if not exists brands_tenant_id_idx ON public.brands USING btree (tenant_id);
create index if not exists idx_brands_active ON public.brands USING btree (is_active);
create index if not exists idx_brands_code ON public.brands USING btree (code);
create unique index if not exists idx_brands_single_default ON public.brands USING btree (is_default) WHERE is_default;
create index if not exists idx_customers_name ON public.customers USING btree (name);
create index if not exists idx_customers_phone ON public.customers USING btree (phone);
create index if not exists idx_deductions_employee ON public.deductions USING btree (employee_id);
create index if not exists idx_deductions_status ON public.deductions USING btree (status);
create index if not exists idx_employees_department ON public.employees USING btree (department);
create index if not exists idx_employees_nik ON public.employees USING btree (nik);
create index if not exists idx_employees_status ON public.employees USING btree (status);
create index if not exists idx_invoice_items_barang ON public.invoice_items USING btree (barang_id);
create index if not exists idx_invoice_items_invoice ON public.invoice_items USING btree (invoice_id);
create index if not exists idx_invoices_brand ON public.invoices USING btree (brand_id);
create index if not exists idx_invoices_customer ON public.invoices USING btree (customer_id);
create index if not exists idx_invoices_no ON public.invoices USING btree (no_invoice);
create index if not exists idx_invoices_order ON public.invoices USING btree (order_id);
create index if not exists idx_invoices_status ON public.invoices USING btree (status_pembayaran);
create index if not exists idx_invoices_tanggal ON public.invoices USING btree (tanggal);
create index if not exists idx_kuitansi_invoice ON public.kuitansi USING btree (invoice_id);
create index if not exists idx_kuitansi_tanggal ON public.kuitansi USING btree (tanggal);
create index if not exists idx_orders_brand ON public.orders USING btree (brand_id);
create index if not exists idx_orders_created_at ON public.orders USING btree (created_at);
create index if not exists idx_orders_customer_id ON public.orders USING btree (customer_id);
create index if not exists idx_orders_deadline ON public.orders USING btree (deadline);
create index if not exists idx_orders_stage ON public.orders USING btree (stage);
create index if not exists idx_orders_stage_entered_at ON public.orders USING btree (stage_entered_at);
create index if not exists orders_is_archived_idx ON public.orders USING btree (is_archived);
create index if not exists orders_tenant_id_idx ON public.orders USING btree (tenant_id);
create index if not exists idx_payroll_entries_employee ON public.payroll_entries USING btree (employee_id);
create index if not exists idx_payroll_entries_period ON public.payroll_entries USING btree (period_id);
create index if not exists idx_payroll_periods_payment_date ON public.payroll_periods USING btree (payment_date);
create index if not exists idx_payroll_periods_status ON public.payroll_periods USING btree (status);
create index if not exists idx_profiles_role ON public.profiles USING btree (role);
create index if not exists r2_files_cleanup_idx ON public.r2_files USING btree (cleanup_status, cleanup_eligible_at) WHERE (status = 'ready'::text);
create index if not exists r2_files_order_idx ON public.r2_files USING btree (order_id);
create index if not exists r2_files_tenant_created_idx ON public.r2_files USING btree (tenant_id, created_at DESC);
create unique index if not exists tenant_memberships_one_default_per_user ON public.tenant_memberships USING btree (user_id) WHERE is_default;
create index if not exists tenant_memberships_user_id_idx ON public.tenant_memberships USING btree (user_id);

-- ----------------------------------------------------------------
-- Functions
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_and_validate_tenant_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE v_brand_tenant UUID; BEGIN IF NEW.tenant_id IS NULL THEN NEW.tenant_id := public.current_tenant_id(); END IF; IF NEW.tenant_id IS NULL THEN RAISE EXCEPTION 'A default tenant membership is required'; END IF; IF TG_TABLE_NAME = 'orders' THEN IF NEW.brand_id IS NOT NULL THEN SELECT tenant_id INTO v_brand_tenant FROM public.brands WHERE id = NEW.brand_id; IF v_brand_tenant IS NULL OR v_brand_tenant <> NEW.tenant_id THEN RAISE EXCEPTION 'Order brand must belong to the same tenant'; END IF; END IF; END IF; RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.assign_new_profile_to_default_tenant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN INSERT INTO public.tenant_memberships (tenant_id, user_id, is_default) SELECT id, NEW.id, TRUE FROM public.tenants WHERE slug = 'legacy-default' ON CONFLICT (tenant_id, user_id) DO NOTHING; RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.check_invoice_item_brand()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_invoice_brand UUID;
    v_barang_brand UUID;
BEGIN
    IF NEW.barang_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT brand_id INTO v_invoice_brand FROM public.invoices WHERE id = NEW.invoice_id;
    SELECT brand_id INTO v_barang_brand FROM public.barang WHERE id = NEW.barang_id;

    IF v_invoice_brand IS NOT NULL AND v_barang_brand IS DISTINCT FROM v_invoice_brand THEN
        RAISE EXCEPTION 'Barang % bukan milik brand invoice ini', NEW.barang_id;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND is_default LIMIT 1; $function$;

CREATE OR REPLACE FUNCTION public.delete_order_permanently(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_tenant_id UUID;
    v_invoice_ids UUID[];
BEGIN
    SELECT tenant_id
    INTO v_tenant_id
    FROM public.orders
    WHERE id = p_order_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Order tidak ditemukan';
    END IF;

    IF NOT public.has_tenant_access(v_tenant_id) THEN
        RAISE EXCEPTION 'Anda tidak memiliki akses untuk menghapus order ini';
    END IF;

    -- This should be impossible because r2_files is tenant-validated, but it
    -- prevents a cross-tenant delete if legacy data is inconsistent.
    IF EXISTS (
        SELECT 1
        FROM public.r2_files
        WHERE order_id = p_order_id
          AND tenant_id IS DISTINCT FROM v_tenant_id
    ) THEN
        RAISE EXCEPTION 'File order memiliki tenant yang tidak konsisten; penghapusan dihentikan';
    END IF;

    SELECT COALESCE(array_agg(id), ARRAY[]::UUID[])
    INTO v_invoice_ids
    FROM public.invoices
    WHERE order_id = p_order_id;

    -- Kuitansi must be removed before invoices because its FK is RESTRICT.
    DELETE FROM public.kuitansi
    WHERE invoice_id = ANY(v_invoice_ids);

    -- Delete explicitly rather than relying on invoice_items' cascade, so the
    -- owned records cleaned by this operation are unambiguous.
    DELETE FROM public.invoice_items
    WHERE invoice_id = ANY(v_invoice_ids);

    DELETE FROM public.invoices
    WHERE order_id = p_order_id;

    -- Objects in R2 are removed by the server action first.  Only their scoped
    -- metadata is removed here after object deletion has succeeded.
    DELETE FROM public.r2_files
    WHERE order_id = p_order_id
      AND tenant_id = v_tenant_id;

    DELETE FROM public.orders
    WHERE id = p_order_id
      AND tenant_id = v_tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        NEW.stage_entered_at = NOW();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_tenant_access(p_tenant_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = p_tenant_id AND user_id = auth.uid()); $function$;

CREATE OR REPLACE FUNCTION public.increment_brand_counter(p_brand_id uuid, p_counter_type text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.prevent_authenticated_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.role() = 'authenticated' AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Authenticated users cannot change their own role';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_default_brand_deactivation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.is_default AND NOT NEW.is_active THEN
        RAISE EXCEPTION 'The default brand cannot be deactivated';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.r2_storage_summary(p_tenant_id uuid)
 RETURNS TABLE(used_bytes bigint, file_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT COALESCE(SUM(size_bytes), 0)::BIGINT, COUNT(*)::BIGINT FROM public.r2_files WHERE tenant_id = p_tenant_id AND status = 'ready'; $function$;

CREATE OR REPLACE FUNCTION public.set_default_brand(p_brand_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_invoice_payment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_r2_file_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE v_brand_tenant UUID; v_order_tenant UUID; v_order_brand UUID; BEGIN SELECT tenant_id INTO v_brand_tenant FROM public.brands WHERE id = NEW.brand_id; IF v_brand_tenant IS NULL OR v_brand_tenant <> NEW.tenant_id THEN RAISE EXCEPTION 'R2 file brand must belong to the same tenant'; END IF; IF NEW.order_id IS NOT NULL THEN SELECT tenant_id, brand_id INTO v_order_tenant, v_order_brand FROM public.orders WHERE id = NEW.order_id; IF v_order_tenant IS NULL OR v_order_tenant <> NEW.tenant_id OR v_order_brand IS DISTINCT FROM NEW.brand_id THEN RAISE EXCEPTION 'R2 file order and brand must belong to the same tenant'; END IF; END IF; RETURN NEW; END; $function$;

-- ----------------------------------------------------------------
-- Row level security
-- ----------------------------------------------------------------
alter table public."allowances" enable row level security;
alter table public."app_settings" enable row level security;
alter table public."attendance_deficit_reports" enable row level security;
alter table public."attendance_logs" enable row level security;
alter table public."barang" enable row level security;
alter table public."barang_harga_tier" enable row level security;
alter table public."bonuses" enable row level security;
alter table public."brands" enable row level security;
alter table public."customers" enable row level security;
alter table public."deductions" enable row level security;
alter table public."employees" enable row level security;
alter table public."invoice_items" enable row level security;
alter table public."invoices" enable row level security;
alter table public."kuitansi" enable row level security;
alter table public."orders" enable row level security;
alter table public."payroll_entries" enable row level security;
alter table public."payroll_periods" enable row level security;
alter table public."profiles" enable row level security;
alter table public."r2_files" enable row level security;
alter table public."tenant_memberships" enable row level security;
alter table public."tenant_r2_connections" enable row level security;
alter table public."tenants" enable row level security;

-- ----------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------
drop policy if exists "Authenticated users can create allowances" on public."allowances";
create policy "Authenticated users can create allowances" on public."allowances" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete allowances" on public."allowances";
create policy "Authenticated users can delete allowances" on public."allowances" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update allowances" on public."allowances";
create policy "Authenticated users can update allowances" on public."allowances" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view allowances" on public."allowances";
create policy "Authenticated users can view allowances" on public."allowances" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can insert app_settings" on public."app_settings";
create policy "Authenticated users can insert app_settings" on public."app_settings" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update app_settings" on public."app_settings";
create policy "Authenticated users can update app_settings" on public."app_settings" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view app_settings" on public."app_settings";
create policy "Authenticated users can view app_settings" on public."app_settings" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create deficit reports" on public."attendance_deficit_reports";
create policy "Authenticated users can create deficit reports" on public."attendance_deficit_reports" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update deficit reports" on public."attendance_deficit_reports";
create policy "Authenticated users can update deficit reports" on public."attendance_deficit_reports" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view deficit reports" on public."attendance_deficit_reports";
create policy "Authenticated users can view deficit reports" on public."attendance_deficit_reports" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create attendance" on public."attendance_logs";
create policy "Authenticated users can create attendance" on public."attendance_logs" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete attendance" on public."attendance_logs";
create policy "Authenticated users can delete attendance" on public."attendance_logs" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update attendance" on public."attendance_logs";
create policy "Authenticated users can update attendance" on public."attendance_logs" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view attendance" on public."attendance_logs";
create policy "Authenticated users can view attendance" on public."attendance_logs" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create barang" on public."barang";
create policy "Authenticated users can create barang" on public."barang" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete barang" on public."barang";
create policy "Authenticated users can delete barang" on public."barang" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update barang" on public."barang";
create policy "Authenticated users can update barang" on public."barang" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view barang" on public."barang";
create policy "Authenticated users can view barang" on public."barang" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create barang_harga_tier" on public."barang_harga_tier";
create policy "Authenticated users can create barang_harga_tier" on public."barang_harga_tier" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete barang_harga_tier" on public."barang_harga_tier";
create policy "Authenticated users can delete barang_harga_tier" on public."barang_harga_tier" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update barang_harga_tier" on public."barang_harga_tier";
create policy "Authenticated users can update barang_harga_tier" on public."barang_harga_tier" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view barang_harga_tier" on public."barang_harga_tier";
create policy "Authenticated users can view barang_harga_tier" on public."barang_harga_tier" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create bonuses" on public."bonuses";
create policy "Authenticated users can create bonuses" on public."bonuses" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete bonuses" on public."bonuses";
create policy "Authenticated users can delete bonuses" on public."bonuses" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update bonuses" on public."bonuses";
create policy "Authenticated users can update bonuses" on public."bonuses" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view bonuses" on public."bonuses";
create policy "Authenticated users can view bonuses" on public."bonuses" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Users can view brands in their tenant" on public."brands";
create policy "Users can view brands in their tenant" on public."brands" as permissive for select to public using (has_tenant_access(tenant_id));
drop policy if exists "Authenticated users can create customers" on public."customers";
create policy "Authenticated users can create customers" on public."customers" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete customers" on public."customers";
create policy "Authenticated users can delete customers" on public."customers" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update customers" on public."customers";
create policy "Authenticated users can update customers" on public."customers" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view customers" on public."customers";
create policy "Authenticated users can view customers" on public."customers" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create deductions" on public."deductions";
create policy "Authenticated users can create deductions" on public."deductions" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete deductions" on public."deductions";
create policy "Authenticated users can delete deductions" on public."deductions" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update deductions" on public."deductions";
create policy "Authenticated users can update deductions" on public."deductions" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view deductions" on public."deductions";
create policy "Authenticated users can view deductions" on public."deductions" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create employees" on public."employees";
create policy "Authenticated users can create employees" on public."employees" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete employees" on public."employees";
create policy "Authenticated users can delete employees" on public."employees" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update employees" on public."employees";
create policy "Authenticated users can update employees" on public."employees" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view employees" on public."employees";
create policy "Authenticated users can view employees" on public."employees" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create invoice_items" on public."invoice_items";
create policy "Authenticated users can create invoice_items" on public."invoice_items" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete invoice_items" on public."invoice_items";
create policy "Authenticated users can delete invoice_items" on public."invoice_items" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update invoice_items" on public."invoice_items";
create policy "Authenticated users can update invoice_items" on public."invoice_items" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view invoice_items" on public."invoice_items";
create policy "Authenticated users can view invoice_items" on public."invoice_items" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create invoices" on public."invoices";
create policy "Authenticated users can create invoices" on public."invoices" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete invoices" on public."invoices";
create policy "Authenticated users can delete invoices" on public."invoices" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update invoices" on public."invoices";
create policy "Authenticated users can update invoices" on public."invoices" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view invoices" on public."invoices";
create policy "Authenticated users can view invoices" on public."invoices" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create kuitansi" on public."kuitansi";
create policy "Authenticated users can create kuitansi" on public."kuitansi" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete kuitansi" on public."kuitansi";
create policy "Authenticated users can delete kuitansi" on public."kuitansi" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update kuitansi" on public."kuitansi";
create policy "Authenticated users can update kuitansi" on public."kuitansi" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view kuitansi" on public."kuitansi";
create policy "Authenticated users can view kuitansi" on public."kuitansi" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Users can create orders in their tenant" on public."orders";
create policy "Users can create orders in their tenant" on public."orders" as permissive for insert to public with check (has_tenant_access(tenant_id));
drop policy if exists "Users can delete orders in their tenant" on public."orders";
create policy "Users can delete orders in their tenant" on public."orders" as permissive for delete to public using (has_tenant_access(tenant_id));
drop policy if exists "Users can update orders in their tenant" on public."orders";
create policy "Users can update orders in their tenant" on public."orders" as permissive for update to public using (has_tenant_access(tenant_id)) with check (has_tenant_access(tenant_id));
drop policy if exists "Users can view orders in their tenant" on public."orders";
create policy "Users can view orders in their tenant" on public."orders" as permissive for select to public using (has_tenant_access(tenant_id));
drop policy if exists "Authenticated users can create payroll entries" on public."payroll_entries";
create policy "Authenticated users can create payroll entries" on public."payroll_entries" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete payroll entries" on public."payroll_entries";
create policy "Authenticated users can delete payroll entries" on public."payroll_entries" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update payroll entries" on public."payroll_entries";
create policy "Authenticated users can update payroll entries" on public."payroll_entries" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view payroll entries" on public."payroll_entries";
create policy "Authenticated users can view payroll entries" on public."payroll_entries" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can create payroll periods" on public."payroll_periods";
create policy "Authenticated users can create payroll periods" on public."payroll_periods" as permissive for insert to public with check ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can delete payroll periods" on public."payroll_periods";
create policy "Authenticated users can delete payroll periods" on public."payroll_periods" as permissive for delete to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can update payroll periods" on public."payroll_periods";
create policy "Authenticated users can update payroll periods" on public."payroll_periods" as permissive for update to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Authenticated users can view payroll periods" on public."payroll_periods";
create policy "Authenticated users can view payroll periods" on public."payroll_periods" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Users can update own profile" on public."profiles";
create policy "Users can update own profile" on public."profiles" as permissive for update to public using ((auth.uid() = id));
drop policy if exists "Users can view all profiles" on public."profiles";
create policy "Users can view all profiles" on public."profiles" as permissive for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "Users can view R2 metadata in their tenant" on public."r2_files";
create policy "Users can view R2 metadata in their tenant" on public."r2_files" as permissive for select to public using (has_tenant_access(tenant_id));
drop policy if exists "Users can view own tenant memberships" on public."tenant_memberships";
create policy "Users can view own tenant memberships" on public."tenant_memberships" as permissive for select to public using ((user_id = auth.uid()));
drop policy if exists "Users can view their tenant" on public."tenants";
create policy "Users can view their tenant" on public."tenants" as permissive for select to public using (has_tenant_access(id));

-- ----------------------------------------------------------------
-- Views
-- ----------------------------------------------------------------
create or replace view public."bottleneck_orders" as  SELECT o.id,
    o.customer_id,
    o.total_quantity,
    o.order_description,
    o.mockup_url,
    o.deadline,
    o.stage,
    o.dp_desain_amount,
    o.dp_desain_verified,
    o.dp_desain_proof_url,
    o.dp_desain_verified_at,
    o.dp_desain_verified_by,
    o.dp_produksi_amount,
    o.dp_produksi_verified,
    o.dp_produksi_proof_url,
    o.dp_produksi_verified_at,
    o.dp_produksi_verified_by,
    o.pelunasan_amount,
    o.pelunasan_verified,
    o.pelunasan_proof_url,
    o.pelunasan_verified_at,
    o.pelunasan_verified_by,
    o.tracking_number,
    o.shipped_at,
    o.stage_entered_at,
    o.created_by,
    o.created_at,
    o.updated_at,
    c.name AS customer_name,
    c.phone AS customer_phone,
    EXTRACT(day FROM now() - o.stage_entered_at) AS days_in_stage
   FROM orders o
     JOIN customers c ON o.customer_id = c.id
  WHERE o.stage = 'cutting_jahit'::text AND o.stage_entered_at < (now() - '3 days'::interval);
create or replace view public."dashboard_metrics" as  SELECT count(*) FILTER (WHERE stage <> 'pengiriman'::text) AS total_active_orders,
    count(*) FILTER (WHERE NOT pelunasan_verified) AS total_unpaid_orders,
    COALESCE(sum(dp_desain_amount + dp_produksi_amount + pelunasan_amount) FILTER (WHERE NOT pelunasan_verified), 0::numeric) AS total_receivables,
    count(*) FILTER (WHERE stage = 'cutting_jahit'::text AND stage_entered_at < (now() - '3 days'::interval)) AS bottleneck_count
   FROM orders;

-- ----------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------
drop trigger if exists "on_auth_user_created" on auth."users";
create trigger on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
drop trigger if exists "on_allowances_updated" on public."allowances";
create trigger on_allowances_updated BEFORE UPDATE ON public.allowances FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_deficit_reports_updated" on public."attendance_deficit_reports";
create trigger on_deficit_reports_updated BEFORE UPDATE ON public.attendance_deficit_reports FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_attendance_updated" on public."attendance_logs";
create trigger on_attendance_updated BEFORE UPDATE ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_barang_updated" on public."barang";
create trigger on_barang_updated BEFORE UPDATE ON public.barang FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "assign_brand_tenant_scope" on public."brands";
create trigger assign_brand_tenant_scope BEFORE INSERT OR UPDATE OF tenant_id ON public.brands FOR EACH ROW EXECUTE FUNCTION assign_and_validate_tenant_scope();
drop trigger if exists "on_brands_updated" on public."brands";
create trigger on_brands_updated BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "protect_default_brand_active" on public."brands";
create trigger protect_default_brand_active BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION prevent_default_brand_deactivation();
drop trigger if exists "on_customers_updated" on public."customers";
create trigger on_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_deductions_updated" on public."deductions";
create trigger on_deductions_updated BEFORE UPDATE ON public.deductions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_employees_updated" on public."employees";
create trigger on_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "trg_invoice_item_brand" on public."invoice_items";
create trigger trg_invoice_item_brand BEFORE INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION check_invoice_item_brand();
drop trigger if exists "on_invoices_updated" on public."invoices";
create trigger on_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_kuitansi_delete" on public."kuitansi";
create trigger on_kuitansi_delete AFTER DELETE ON public.kuitansi FOR EACH ROW EXECUTE FUNCTION update_invoice_payment();
drop trigger if exists "on_kuitansi_insert" on public."kuitansi";
create trigger on_kuitansi_insert AFTER INSERT ON public.kuitansi FOR EACH ROW EXECUTE FUNCTION update_invoice_payment();
drop trigger if exists "on_kuitansi_update" on public."kuitansi";
create trigger on_kuitansi_update AFTER UPDATE ON public.kuitansi FOR EACH ROW EXECUTE FUNCTION update_invoice_payment();
drop trigger if exists "assign_order_tenant_scope" on public."orders";
create trigger assign_order_tenant_scope BEFORE INSERT OR UPDATE OF tenant_id, brand_id ON public.orders FOR EACH ROW EXECUTE FUNCTION assign_and_validate_tenant_scope();
drop trigger if exists "on_orders_stage_changed" on public."orders";
create trigger on_orders_stage_changed BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION handle_stage_change();
drop trigger if exists "on_orders_updated" on public."orders";
create trigger on_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_payroll_entries_updated" on public."payroll_entries";
create trigger on_payroll_entries_updated BEFORE UPDATE ON public.payroll_entries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "on_payroll_periods_updated" on public."payroll_periods";
create trigger on_payroll_periods_updated BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "assign_new_profile_default_tenant" on public."profiles";
create trigger assign_new_profile_default_tenant AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION assign_new_profile_to_default_tenant();
drop trigger if exists "on_profiles_updated" on public."profiles";
create trigger on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "protect_profile_role" on public."profiles";
create trigger protect_profile_role BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_authenticated_role_change();
drop trigger if exists "on_r2_files_updated" on public."r2_files";
create trigger on_r2_files_updated BEFORE UPDATE ON public.r2_files FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "validate_r2_file_tenant_scope" on public."r2_files";
create trigger validate_r2_file_tenant_scope BEFORE INSERT OR UPDATE OF tenant_id, brand_id, order_id ON public.r2_files FOR EACH ROW EXECUTE FUNCTION validate_r2_file_scope();
drop trigger if exists "on_tenant_r2_connections_updated" on public."tenant_r2_connections";
create trigger on_tenant_r2_connections_updated BEFORE UPDATE ON public.tenant_r2_connections FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ----------------------------------------------------------------
-- Function privileges
-- ----------------------------------------------------------------
revoke all on function public.delete_order_permanently(uuid) from public;
grant execute on function public.delete_order_permanently(uuid) to authenticated, service_role;
revoke all on function public.current_tenant_id() from public;
revoke all on function public.has_tenant_access(uuid) from public;
grant execute on function public.current_tenant_id() to authenticated, service_role;
grant execute on function public.has_tenant_access(uuid) to authenticated, service_role;
revoke all on function public.r2_storage_summary(uuid) from public;
grant execute on function public.r2_storage_summary(uuid) to service_role;
revoke all on function public.set_default_brand(uuid) from public;
grant execute on function public.set_default_brand(uuid) to authenticated;
revoke all on function public.increment_brand_counter(uuid, text) from public;
grant execute on function public.increment_brand_counter(uuid, text) to service_role;
