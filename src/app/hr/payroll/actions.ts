'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Generate payroll for a period
export async function generatePayroll(startDate: string, endDate: string): Promise<{ success: boolean; error?: string; periodId?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Create period name (e.g., "Januari 2026")
        const start = new Date(startDate)
        const periodName = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

        // Determine payment date (3rd of next month, or 2nd if Sunday)
        const paymentDate = new Date(endDate)
        paymentDate.setDate(3)
        if (paymentDate.getDay() === 0) { // Sunday
            paymentDate.setDate(2)
        }

        // Check if period already exists
        const { data: existingPeriod } = await supabase
            .from('payroll_periods')
            .select('id')
            .eq('period_name', periodName)
            .single()

        if (existingPeriod) {
            return { success: false, error: 'Periode payroll sudah ada' }
        }

        // Create payroll period
        const { data: period, error: periodError } = await supabase
            .from('payroll_periods')
            .insert({
                period_name: periodName,
                start_date: startDate,
                end_date: endDate,
                payment_date: paymentDate.toISOString().split('T')[0],
                status: 'draft'
            })
            .select()
            .single()

        if (periodError || !period) {
            console.error('Create period error:', periodError)
            return { success: false, error: 'Gagal membuat periode payroll' }
        }

        // Fetch all active employees
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('status', 'active')

        if (empError || !employees) {
            return { success: false, error: 'Gagal memuat data karyawan' }
        }

        // Generate payroll entry for each employee
        for (const employee of employees) {
            // Fetch attendance logs for this period
            const { data: attendanceLogs } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('employee_id', employee.id)
                .gte('date', startDate)
                .lte('date', endDate)
                .in('status', ['present', 'late', 'holiday_overtime'])

            const totalWorkDays = attendanceLogs?.length || 0

            // Calculate base salary (daily_rate × work days)
            const baseSalary = employee.daily_rate * totalWorkDays

            // Fetch allowances
            const { data: allowances } = await supabase
                .from('allowances')
                .select('*')
                .eq('employee_id', employee.id)
                .eq('is_active', true)

            let totalAllowances = 0
            const allowanceBreakdown: Record<string, number> = {}

            allowances?.forEach(allowance => {
                let amount = 0
                if (allowance.calculation_method === 'per_day') {
                    amount = allowance.amount * totalWorkDays
                } else { // per_month
                    amount = allowance.amount
                }
                totalAllowances += amount
                allowanceBreakdown[allowance.allowance_type] = amount
            })

            // Calculate overtime
            const weekdayOvertimeHours = attendanceLogs?.reduce((sum, log) => {
                if (log.status === 'present' || log.status === 'late') {
                    return sum + (log.overtime_hours || 0)
                }
                return sum
            }, 0) || 0

            const holidayOvertimeDays = attendanceLogs?.filter(log => log.status === 'holiday_overtime').length || 0

            const weekdayOvertimeAmount = weekdayOvertimeHours * 10000
            const holidayOvertimeAmount = holidayOvertimeDays * 100000
            const totalOvertime = weekdayOvertimeAmount + holidayOvertimeAmount

            const overtimeBreakdown = {
                weekday_hours: weekdayOvertimeHours,
                weekday_amount: weekdayOvertimeAmount,
                holiday_days: holidayOvertimeDays,
                holiday_amount: holidayOvertimeAmount
            }

            // Fetch bonuses for this period
            const month = start.getMonth() + 1
            const year = start.getFullYear()

            const { data: bonuses } = await supabase
                .from('bonuses')
                .select('*')
                .eq('employee_id', employee.id)
                .eq('period_month', month)
                .eq('period_year', year)

            const totalBonuses = bonuses?.reduce((sum, bonus) => sum + bonus.amount, 0) || 0
            const bonusBreakdown = bonuses?.map(b => ({
                type: b.bonus_type,
                amount: b.amount,
                reason: b.reason
            })) || []

            // Fetch active deductions (kasbon)
            const { data: deductions } = await supabase
                .from('deductions')
                .select('*')
                .eq('employee_id', employee.id)
                .eq('status', 'active')

            let totalDeductions = 0
            const deductionBreakdown: Array<{ type: string; amount: number; remaining: number }> = []

            for (const deduction of deductions || []) {
                const deductAmount = Math.min(deduction.installment_per_period, deduction.remaining_amount)
                totalDeductions += deductAmount

                deductionBreakdown.push({
                    type: deduction.deduction_type,
                    amount: deductAmount,
                    remaining: deduction.remaining_amount - deductAmount
                })

                // Update remaining amount (will be applied when payroll is approved)
                // For now, just record in breakdown
            }

            // Calculate gross and net salary
            const grossSalary = baseSalary + totalAllowances + totalOvertime + totalBonuses
            const netSalary = grossSalary - totalDeductions

            // Insert payroll entry
            await supabase
                .from('payroll_entries')
                .insert({
                    period_id: period.id,
                    employee_id: employee.id,
                    total_work_days: totalWorkDays,
                    daily_rate: employee.daily_rate,
                    base_salary: baseSalary,
                    total_allowances: totalAllowances,
                    total_overtime: totalOvertime,
                    total_bonuses: totalBonuses,
                    gross_salary: grossSalary,
                    total_deductions: totalDeductions,
                    net_salary: netSalary,
                    allowance_breakdown: allowanceBreakdown,
                    overtime_breakdown: overtimeBreakdown,
                    bonus_breakdown: bonusBreakdown,
                    deduction_breakdown: deductionBreakdown
                })
        }

        revalidatePath('/hr/payroll')
        return { success: true, periodId: period.id }
    } catch (error) {
        console.error('Generate payroll exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Submit payroll for owner approval
export async function submitPayrollForApproval(periodId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('payroll_periods')
            .update({ status: 'pending_approval' })
            .eq('id', periodId)

        if (error) {
            console.error('Submit payroll error:', error)
            return { success: false, error: 'Gagal submit payroll' }
        }

        revalidatePath('/hr/payroll')
        revalidatePath(`/hr/payroll/${periodId}`)
        return { success: true }
    } catch (error) {
        console.error('Submit payroll exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Owner approve payroll
export async function approvePayroll(periodId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if user is owner
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'owner') {
            return { success: false, error: 'Hanya Owner yang bisa approve payroll' }
        }

        // Update period status
        const { error: updateError } = await supabase
            .from('payroll_periods')
            .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', periodId)

        if (updateError) {
            console.error('Approve payroll error:', updateError)
            return { success: false, error: 'Gagal approve payroll' }
        }

        // Update kasbon remaining amounts
        const { data: entries } = await supabase
            .from('payroll_entries')
            .select('employee_id, deduction_breakdown')
            .eq('period_id', periodId)

        for (const entry of entries || []) {
            const deductions = entry.deduction_breakdown as Array<{ type: string; amount: number; remaining: number }>

            for (const ded of deductions || []) {
                // Update deduction remaining amount
                const { data: activeDeduction } = await supabase
                    .from('deductions')
                    .select('*')
                    .eq('employee_id', entry.employee_id)
                    .eq('deduction_type', ded.type)
                    .eq('status', 'active')
                    .single()

                if (activeDeduction) {
                    const newRemaining = activeDeduction.remaining_amount - ded.amount

                    if (newRemaining <= 0) {
                        // Mark as paid off
                        await supabase
                            .from('deductions')
                            .update({
                                remaining_amount: 0,
                                status: 'paid_off'
                            })
                            .eq('id', activeDeduction.id)
                    } else {
                        await supabase
                            .from('deductions')
                            .update({ remaining_amount: newRemaining })
                            .eq('id', activeDeduction.id)
                    }
                }
            }
        }

        revalidatePath('/hr/payroll')
        revalidatePath(`/hr/payroll/${periodId}`)
        return { success: true }
    } catch (error) {
        console.error('Approve payroll exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}
