import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Manual Attendance Entry API (for Admin fallback when fingerprint fails)
 * 
 * Requires authentication (Admin/Owner only)
 * 
 * POST body:
 * {
 *   "employee_id": "uuid",
 *   "date": "2026-02-03",
 *   "check_in": "2026-02-03T08:00:00+07:00",
 *   "check_out": "2026-02-03T17:00:00+07:00",
 *   "notes": "Optional notes"
 * }
 */

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { employee_id, date, check_in, check_out, notes } = body

        if (!employee_id || !date || !check_in || !check_out) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Verify employee exists and is active
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('id, full_name, status')
            .eq('id', employee_id)
            .single()

        if (employeeError || !employee || employee.status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Employee not found or inactive' },
                { status: 404 }
            )
        }

        // Calculate hours
        const checkInTime = new Date(check_in)
        const checkOutTime = new Date(check_out)
        const totalTimeMs = checkOutTime.getTime() - checkInTime.getTime()
        const totalTimeHours = totalTimeMs / (1000 * 60 * 60)

        if (totalTimeHours < 0) {
            return NextResponse.json(
                { success: false, error: 'Check-out must be after check-in' },
                { status: 400 }
            )
        }

        const breakTime = 1.0
        const effectiveHours = Math.max(0, totalTimeHours - breakTime)
        const overtimeHours = Math.max(0, effectiveHours - 8)
        const deficitHours = effectiveHours < 8 ? (8 - effectiveHours) : 0

        // Check if holiday
        const isHoliday = checkOutTime.getDay() === 0
        const status = isHoliday && effectiveHours >= 4 ? 'holiday_overtime' : 'present'

        // Insert or update attendance log
        const { error: upsertError } = await supabase
            .from('attendance_logs')
            .upsert({
                employee_id: employee_id,
                date: date,
                check_in: check_in,
                check_out: check_out,
                total_time_in_office: totalTimeHours,
                break_time: breakTime,
                effective_hours: effectiveHours,
                overtime_hours: overtimeHours,
                deficit_hours: deficitHours,
                status: status,
                method: 'manual',
                notes: notes || `Manual entry by admin (${user.email})`
            }, {
                onConflict: 'employee_id,date'
            })

        if (upsertError) {
            console.error('Manual attendance upsert error:', upsertError)
            return NextResponse.json(
                { success: false, error: 'Failed to save attendance' },
                { status: 500 }
            )
        }

        // Update deficit report if applicable
        if (deficitHours > 0) {
            const month = checkOutTime.getMonth() + 1
            const year = checkOutTime.getFullYear()

            const { data: deficitReport } = await supabase
                .from('attendance_deficit_reports')
                .select('*')
                .eq('employee_id', employee_id)
                .eq('month', month)
                .eq('year', year)
                .single()

            if (deficitReport) {
                await supabase
                    .from('attendance_deficit_reports')
                    .update({
                        total_deficit_hours: deficitReport.total_deficit_hours + deficitHours,
                        deficit_count: deficitReport.deficit_count + 1
                    })
                    .eq('id', deficitReport.id)
            } else {
                await supabase
                    .from('attendance_deficit_reports')
                    .insert({
                        employee_id: employee_id,
                        month: month,
                        year: year,
                        total_deficit_hours: deficitHours,
                        deficit_count: 1
                    })
            }
        }

        return NextResponse.json({
            success: true,
            message: `Manual attendance recorded for ${employee.full_name}`,
            data: {
                employee_id,
                date,
                effective_hours: parseFloat(effectiveHours.toFixed(2)),
                overtime_hours: parseFloat(overtimeHours.toFixed(2)),
                deficit_hours: parseFloat(deficitHours.toFixed(2))
            }
        })

    } catch (error) {
        console.error('Manual attendance API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
