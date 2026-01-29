import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Endpoint for BioFinger AT-301W Push SDK
 * 
 * BioFinger will POST data in this format:
 * {
 *   "device_id": "AT301W_001",
 *   "user_id": "EMP001",  // This is the NIK from employees table
 *   "timestamp": "2026-02-03T08:10:25+07:00",
 *   "event": "check_in" | "check_out",
 *   "verification": "fingerprint"
 * }
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { user_id: nik, timestamp, event } = body

        if (!nik || !timestamp || !event) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: user_id, timestamp, event' },
                { status: 400 }
            )
        }

        // Create Supabase client (using service role for RLS bypass if needed)
        // For this specific endpoint, we might need to use admin client since fingerprint machine doesn't have auth
        const supabase = await createClient()

        // 1. Find employee by NIK
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('id, full_name, status')
            .eq('nik', nik)
            .eq('status', 'active')
            .single()

        if (employeeError || !employee) {
            return NextResponse.json(
                { success: false, error: `Employee with NIK ${nik} not found or inactive` },
                { status: 404 }
            )
        }

        // 2. Parse timestamp and extract date
        const checkTime = new Date(timestamp)
        const dateStr = checkTime.toISOString().split('T')[0] // YYYY-MM-DD

        // 3. Handle check-in or check-out
        if (event === 'check_in') {
            // Check if there's already a check-in for today
            const { data: existingLog } = await supabase
                .from('attendance_logs')
                .select('id')
                .eq('employee_id', employee.id)
                .eq('date', dateStr)
                .single()

            if (existingLog) {
                return NextResponse.json(
                    { success: false, error: 'Already checked in today' },
                    { status: 409 }
                )
            }

            // Create new attendance log
            const { error: insertError } = await supabase
                .from('attendance_logs')
                .insert({
                    employee_id: employee.id,
                    date: dateStr,
                    check_in: timestamp,
                    status: 'present',
                    method: 'fingerprint'
                })

            if (insertError) {
                console.error('Check-in insert error:', insertError)
                return NextResponse.json(
                    { success: false, error: 'Failed to record check-in' },
                    { status: 500 }
                )
            }

            return NextResponse.json({
                success: true,
                message: `Check-in recorded for ${employee.full_name}`,
                type: 'check_in',
                timestamp: checkTime.toISOString()
            })

        } else if (event === 'check_out') {
            // Find today's attendance log
            const { data: attendanceLog, error: fetchError } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('employee_id', employee.id)
                .eq('date', dateStr)
                .single()

            if (fetchError || !attendanceLog) {
                return NextResponse.json(
                    { success: false, error: 'No check-in found for today. Please check-in first.' },
                    { status: 404 }
                )
            }

            if (attendanceLog.check_out) {
                return NextResponse.json(
                    { success: false, error: 'Already checked out today' },
                    { status: 409 }
                )
            }

            // Calculate hours
            const checkInTime = new Date(attendanceLog.check_in)
            const checkOutTime = checkTime
            const totalTimeMs = checkOutTime.getTime() - checkInTime.getTime()
            const totalTimeHours = totalTimeMs / (1000 * 60 * 60) // Convert ms to hours

            const breakTime = 1.0 // Fixed 1 hour
            const effectiveHours = Math.max(0, totalTimeHours - breakTime)

            // Calculate overtime and deficit
            const overtimeHours = Math.max(0, effectiveHours - 8)
            const deficitHours = effectiveHours < 8 ? (8 - effectiveHours) : 0

            // Check if today is a holiday (Sunday = 0)
            const isHoliday = checkOutTime.getDay() === 0
            const status = isHoliday && effectiveHours >= 4 ? 'holiday_overtime' : 'present'

            // Update attendance log
            const { error: updateError } = await supabase
                .from('attendance_logs')
                .update({
                    check_out: timestamp,
                    total_time_in_office: totalTimeHours,
                    break_time: breakTime,
                    effective_hours: effectiveHours,
                    overtime_hours: overtimeHours,
                    deficit_hours: deficitHours,
                    status: status
                })
                .eq('id', attendanceLog.id)

            if (updateError) {
                console.error('Check-out update error:', updateError)
                return NextResponse.json(
                    { success: false, error: 'Failed to record check-out' },
                    { status: 500 }
                )
            }

            // If there's deficit, update monthly deficit report
            if (deficitHours > 0) {
                const month = checkOutTime.getMonth() + 1 // 1-12
                const year = checkOutTime.getFullYear()

                // Upsert deficit report
                const { data: deficitReport } = await supabase
                    .from('attendance_deficit_reports')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .eq('month', month)
                    .eq('year', year)
                    .single()

                if (deficitReport) {
                    // Update existing
                    await supabase
                        .from('attendance_deficit_reports')
                        .update({
                            total_deficit_hours: deficitReport.total_deficit_hours + deficitHours,
                            deficit_count: deficitReport.deficit_count + 1
                        })
                        .eq('id', deficitReport.id)
                } else {
                    // Create new
                    await supabase
                        .from('attendance_deficit_reports')
                        .insert({
                            employee_id: employee.id,
                            month: month,
                            year: year,
                            total_deficit_hours: deficitHours,
                            deficit_count: 1
                        })
                }
            }

            return NextResponse.json({
                success: true,
                message: `Check-out recorded for ${employee.full_name}`,
                type: 'check_out',
                timestamp: checkTime.toISOString(),
                summary: {
                    total_hours: parseFloat(totalTimeHours.toFixed(2)),
                    effective_hours: parseFloat(effectiveHours.toFixed(2)),
                    overtime_hours: parseFloat(overtimeHours.toFixed(2)),
                    deficit_hours: parseFloat(deficitHours.toFixed(2)),
                    is_holiday: isHoliday
                }
            })

        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid event type. Must be "check_in" or "check_out"' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Attendance push API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// OPTIONS for CORS preflight (if needed by fingerprint device)
export async function OPTIONS() {
    return NextResponse.json(
        {},
        {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }
    )
}
