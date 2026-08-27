-- Quick test: Insert manual attendance for Test Employee
-- Run this in Supabase SQL Editor to test if attendance display works

-- First, get the employee_id for EMP999
-- Then insert a check-in record

INSERT INTO attendance_logs (
    employee_id,
    date,
    check_in,
    check_out,
    effective_hours,
    overtime_hours,
    overtime_type,
    deficit_hours,
    forgot_checkout,
    status
)
SELECT 
    id as employee_id,
    CURRENT_DATE as date,
    NOW() as check_in,
    NULL as check_out,
    NULL as effective_hours,
    0 as overtime_hours,
    NULL as overtime_type,
    0 as deficit_hours,
    false as forgot_checkout,
    'present' as status
FROM employees
WHERE nik = 'EMP999'
LIMIT 1;

-- Check if record was created
SELECT 
    al.*,
    e.full_name,
    e.nik
FROM attendance_logs al
JOIN employees e ON e.id = al.employee_id
WHERE al.date = CURRENT_DATE
ORDER BY al.check_in DESC;
