-- ===========================================
-- HR SYSTEM: ATTENDANCE & PAYROLL
-- ERP Kozo KPK - BioFinger AT-301W Integration
-- ===========================================

-- =====================
-- 1. EMPLOYEES TABLE
-- Master data for workforce (separate from login users/profiles)
-- =====================
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik TEXT NOT NULL UNIQUE, -- Unique ID for fingerprint device mapping
    full_name TEXT NOT NULL,
    department TEXT NOT NULL CHECK (department IN ('Produksi', 'QC', 'Packing', 'Admin', 'Sales')),
    position TEXT NOT NULL,
    daily_rate NUMERIC(12,2) NOT NULL CHECK (daily_rate > 0), -- Daily salary rate (NOT monthly)
    join_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    bank_account TEXT, -- For salary slip info
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_nik ON public.employees(nik);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_department ON public.employees(department);

-- =====================
-- 2. ALLOWANCES TABLE
-- Dynamic allowances per employee (transport, meal, position, etc.)
-- =====================
CREATE TABLE public.allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    allowance_type TEXT NOT NULL CHECK (allowance_type IN ('transport', 'meal', 'position', 'other')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    calculation_method TEXT NOT NULL DEFAULT 'per_day' CHECK (calculation_method IN ('per_day', 'per_month')),
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allowances_employee ON public.allowances(employee_id);
CREATE INDEX idx_allowances_active ON public.allowances(is_active);

-- =====================
-- 3. DEDUCTIONS TABLE
-- Kasbon tracking with installment system
-- =====================
CREATE TABLE public.deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    deduction_type TEXT NOT NULL DEFAULT 'kasbon' CHECK (deduction_type IN ('kasbon', 'other')),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    remaining_amount NUMERIC(12,2) NOT NULL CHECK (remaining_amount >= 0),
    installment_per_period NUMERIC(12,2) NOT NULL CHECK (installment_per_period > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deductions_employee ON public.deductions(employee_id);
CREATE INDEX idx_deductions_status ON public.deductions(status);

-- =====================
-- 4. BONUSES TABLE
-- Performance/target bonuses
-- =====================
CREATE TABLE public.bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    bonus_type TEXT NOT NULL CHECK (bonus_type IN ('performance', 'target', 'project_completion', 'other')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL CHECK (period_year >= 2020),
    reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bonuses_employee ON public.bonuses(employee_id);
CREATE INDEX idx_bonuses_period ON public.bonuses(period_year, period_month);

-- =====================
-- 5. ATTENDANCE LOGS TABLE
-- Daily attendance with effective hours calculation
-- Key: 9 hours in office - 1 hour break = 8 hours effective
-- =====================
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    
    -- Time calculations
    total_time_in_office NUMERIC(5,2), -- Hours (check_out - check_in)
    break_time NUMERIC(5,2) DEFAULT 1.0, -- Fixed 1 hour break
    effective_hours NUMERIC(5,2), -- total_time_in_office - break_time
    
    -- Overtime & Deficit
    overtime_hours NUMERIC(5,2) DEFAULT 0, -- If effective_hours > 8
    deficit_hours NUMERIC(5,2) DEFAULT 0, -- If effective_hours < 8 (warning only, NO salary deduction)
    
    -- Flags
    forgot_checkout BOOLEAN DEFAULT FALSE, -- Auto-close at 23:59 flag
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'leave', 'sick', 'holiday_overtime')),
    method TEXT NOT NULL DEFAULT 'fingerprint' CHECK (method IN ('fingerprint', 'manual')),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one attendance record per employee per day
    UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_employee ON public.attendance_logs(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance_logs(date);
CREATE INDEX idx_attendance_status ON public.attendance_logs(status);
CREATE INDEX idx_attendance_employee_date ON public.attendance_logs(employee_id, date);

-- =====================
-- 6. ATTENDANCE DEFICIT REPORTS TABLE
-- Monthly accumulated deficit hours (for owner warning)
-- =====================
CREATE TABLE public.attendance_deficit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2020),
    total_deficit_hours NUMERIC(10,2) DEFAULT 0, -- Accumulated deficit in the month
    deficit_count INT DEFAULT 0, -- Number of days with deficit
    report_sent_to_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, year, month)
);

CREATE INDEX idx_deficit_reports_employee ON public.attendance_deficit_reports(employee_id);
CREATE INDEX idx_deficit_reports_period ON public.attendance_deficit_reports(year, month);

-- =====================
-- 7. PAYROLL PERIODS TABLE
-- Monthly payroll cycles (generated on 3rd of each month, or 2nd if Sunday)
-- =====================
CREATE TABLE public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name TEXT NOT NULL, -- e.g., "Januari 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL, -- 3rd of month (or 2nd if Sunday)
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid')),
    
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(period_name)
);

CREATE INDEX idx_payroll_periods_status ON public.payroll_periods(status);
CREATE INDEX idx_payroll_periods_payment_date ON public.payroll_periods(payment_date);

-- =====================
-- 8. PAYROLL ENTRIES TABLE
-- Individual salary slips (one per employee per period)
-- =====================
CREATE TABLE public.payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Work summary
    total_work_days INT NOT NULL DEFAULT 0,
    daily_rate NUMERIC(12,2) NOT NULL, -- Snapshot of employee.daily_rate at generation time
    
    -- Income components
    base_salary NUMERIC(12,2) NOT NULL DEFAULT 0, -- total_work_days × daily_rate
    total_allowances NUMERIC(12,2) DEFAULT 0,
    total_overtime NUMERIC(12,2) DEFAULT 0, -- Weekday overtime + Holiday overtime
    total_bonuses NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) NOT NULL DEFAULT 0, -- Sum of all income
    
    -- Deductions
    total_deductions NUMERIC(12,2) DEFAULT 0, -- Kasbon installments
    
    -- Net salary
    net_salary NUMERIC(12,2) NOT NULL DEFAULT 0, -- gross_salary - total_deductions
    
    -- Detailed breakdowns (JSONB for flexibility)
    allowance_breakdown JSONB, -- {"transport": 300000, "meal": 225000, "position": 500000}
    overtime_breakdown JSONB,  -- {"weekday_hours": 8, "weekday_amount": 80000, "holiday_days": 2, "holiday_amount": 200000}
    bonus_breakdown JSONB,     -- [{"type": "performance", "amount": 150000, "reason": "..."}]
    deduction_breakdown JSONB, -- [{"type": "kasbon", "amount": 200000, "remaining": 800000}]
    
    -- Metadata
    printed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(period_id, employee_id)
);

CREATE INDEX idx_payroll_entries_period ON public.payroll_entries(period_id);
CREATE INDEX idx_payroll_entries_employee ON public.payroll_entries(employee_id);

-- =====================
-- TRIGGERS & FUNCTIONS
-- =====================

-- Auto-update updated_at for all tables
CREATE TRIGGER on_employees_updated
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_allowances_updated
    BEFORE UPDATE ON public.allowances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_deductions_updated
    BEFORE UPDATE ON public.deductions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_attendance_updated
    BEFORE UPDATE ON public.attendance_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_deficit_reports_updated
    BEFORE UPDATE ON public.attendance_deficit_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_payroll_periods_updated
    BEFORE UPDATE ON public.payroll_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_payroll_entries_updated
    BEFORE UPDATE ON public.payroll_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_deficit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- Full CRUD for authenticated users (Owner & Admin)
-- Employees
CREATE POLICY "Authenticated users can view employees"
    ON public.employees FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create employees"
    ON public.employees FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update employees"
    ON public.employees FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete employees"
    ON public.employees FOR DELETE
    USING (auth.role() = 'authenticated');

-- Allowances
CREATE POLICY "Authenticated users can view allowances"
    ON public.allowances FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create allowances"
    ON public.allowances FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update allowances"
    ON public.allowances FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete allowances"
    ON public.allowances FOR DELETE
    USING (auth.role() = 'authenticated');

-- Deductions
CREATE POLICY "Authenticated users can view deductions"
    ON public.deductions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create deductions"
    ON public.deductions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update deductions"
    ON public.deductions FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete deductions"
    ON public.deductions FOR DELETE
    USING (auth.role() = 'authenticated');

-- Bonuses
CREATE POLICY "Authenticated users can view bonuses"
    ON public.bonuses FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create bonuses"
    ON public.bonuses FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bonuses"
    ON public.bonuses FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete bonuses"
    ON public.bonuses FOR DELETE
    USING (auth.role() = 'authenticated');

-- Attendance Logs
CREATE POLICY "Authenticated users can view attendance"
    ON public.attendance_logs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create attendance"
    ON public.attendance_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attendance"
    ON public.attendance_logs FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete attendance"
    ON public.attendance_logs FOR DELETE
    USING (auth.role() = 'authenticated');

-- Deficit Reports
CREATE POLICY "Authenticated users can view deficit reports"
    ON public.attendance_deficit_reports FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create deficit reports"
    ON public.attendance_deficit_reports FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update deficit reports"
    ON public.attendance_deficit_reports FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Payroll Periods
CREATE POLICY "Authenticated users can view payroll periods"
    ON public.payroll_periods FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create payroll periods"
    ON public.payroll_periods FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payroll periods"
    ON public.payroll_periods FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payroll periods"
    ON public.payroll_periods FOR DELETE
    USING (auth.role() = 'authenticated');

-- Payroll Entries
CREATE POLICY "Authenticated users can view payroll entries"
    ON public.payroll_entries FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create payroll entries"
    ON public.payroll_entries FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payroll entries"
    ON public.payroll_entries FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payroll entries"
    ON public.payroll_entries FOR DELETE
    USING (auth.role() = 'authenticated');

-- =====================
-- SCHEMA COMPLETE!
-- =====================
