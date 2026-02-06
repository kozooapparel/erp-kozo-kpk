import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * ZKTeco ADMS Protocol - Data Push Endpoint (cdata)
 * 
 * Devices POST attendance data to:
 * POST /iclock/cdata?SN=SERIAL_NUMBER&table=ATTLOG&Stamp=9999
 * 
 * Body format (tab-separated):
 * UserPIN\tDateTime\tStatus\tVerifyMode\t...\n
 * 
 * Example: 
 * 2\t2022-07-12 16:00:20\t1\t15\t\t0\t0\t\t\t43\n
 * 
 * Status: 0 = Check-In, 1 = Check-Out
 */

interface AttendanceRecord {
    userPin: string
    datetime: string
    status: number // 0 = check_in, 1 = check_out
    verifyMode: number
}

function parseAttendanceData(body: string): AttendanceRecord[] {
    const records: AttendanceRecord[] = []
    const lines = body.trim().split('\n')

    for (const line of lines) {
        if (!line.trim()) continue

        const parts = line.split('\t')
        if (parts.length >= 3) {
            records.push({
                userPin: parts[0].trim(),
                datetime: parts[1].trim(),
                status: parseInt(parts[2].trim()) || 0,
                verifyMode: parseInt(parts[3]?.trim()) || 0
            })
        }
    }

    return records
}

export async function GET(request: NextRequest) {
    // Some devices send GET request for cdata to check connectivity
    const searchParams = request.nextUrl.searchParams
    const serialNumber = searchParams.get('SN')
    const table = searchParams.get('table')

    console.log(`[ADMS] cdata GET request - SN: ${serialNumber}, table: ${table}`)

    return new NextResponse('OK', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const serialNumber = searchParams.get('SN')
        const table = searchParams.get('table')

        console.log(`[ADMS] Data push received - SN: ${serialNumber}, table: ${table}`)

        // Get raw body as text (ADMS uses tab-separated format, not JSON)
        const body = await request.text()
        console.log(`[ADMS] Raw body: ${body}`)

        // Only process attendance logs
        if (table !== 'ATTLOG') {
            console.log(`[ADMS] Ignoring non-ATTLOG table: ${table}`)
            return new NextResponse('OK', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            })
        }

        // Parse attendance data
        const records = parseAttendanceData(body)

        if (records.length === 0) {
            console.log('[ADMS] No valid attendance records found')
            return new NextResponse('OK', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            })
        }

        const supabase = await createClient()

        for (const record of records) {
            console.log(`[ADMS] Processing record:`, record)

            // Find employee by NIK (userPin = NIK in our system)
            const { data: employee, error: employeeError } = await supabase
                .from('employees')
                .select('id, full_name, nik, status')
                .eq('nik', record.userPin)
                .eq('status', 'active')
                .single()

            if (employeeError || !employee) {
                console.log(`[ADMS] Employee not found for NIK: ${record.userPin}`)
                continue
            }

            // Parse datetime (format: YYYY-MM-DD HH:MM:SS)
            const checkTime = new Date(record.datetime)
            const dateStr = checkTime.toISOString().split('T')[0]
            const event = record.status === 0 ? 'check_in' : 'check_out'

            console.log(`[ADMS] Processing ${event} for ${employee.full_name} at ${record.datetime}`)

            if (event === 'check_in') {
                // Check if there's already a check-in for today
                const { data: existingLog } = await supabase
                    .from('attendance_logs')
                    .select('id')
                    .eq('employee_id', employee.id)
                    .eq('date', dateStr)
                    .single()

                if (existingLog) {
                    console.log(`[ADMS] Already checked in today: ${employee.full_name}`)
                    continue
                }

                // Create new attendance log
                const { error: insertError } = await supabase
                    .from('attendance_logs')
                    .insert({
                        employee_id: employee.id,
                        date: dateStr,
                        check_in: checkTime.toISOString(),
                        status: 'present',
                        method: 'fingerprint',
                        device_sn: serialNumber
                    })

                if (insertError) {
                    console.error(`[ADMS] Check-in insert error:`, insertError)
                } else {
                    console.log(`[ADMS] Check-in recorded for ${employee.full_name}`)
                }

            } else if (event === 'check_out') {
                // Find today's attendance log
                const { data: attendanceLog, error: fetchError } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .eq('date', dateStr)
                    .single()

                if (fetchError || !attendanceLog) {
                    console.log(`[ADMS] No check-in found for today: ${employee.full_name}`)
                    continue
                }

                if (attendanceLog.check_out) {
                    console.log(`[ADMS] Already checked out today: ${employee.full_name}`)
                    continue
                }

                // Calculate hours
                const checkInTime = new Date(attendanceLog.check_in)
                const checkOutTime = checkTime
                const totalTimeMs = checkOutTime.getTime() - checkInTime.getTime()
                const totalTimeHours = totalTimeMs / (1000 * 60 * 60)

                const breakTime = 1.0
                const effectiveHours = Math.max(0, totalTimeHours - breakTime)
                const overtimeHours = Math.max(0, effectiveHours - 8)
                const deficitHours = effectiveHours < 8 ? (8 - effectiveHours) : 0

                // Check if today is a holiday (Sunday = 0)
                const isHoliday = checkOutTime.getDay() === 0
                const status = isHoliday && effectiveHours >= 4 ? 'holiday_overtime' : 'present'

                // Update attendance log
                const { error: updateError } = await supabase
                    .from('attendance_logs')
                    .update({
                        check_out: checkTime.toISOString(),
                        total_time_in_office: totalTimeHours,
                        break_time: breakTime,
                        effective_hours: effectiveHours,
                        overtime_hours: overtimeHours,
                        deficit_hours: deficitHours,
                        status: status,
                        device_sn: serialNumber
                    })
                    .eq('id', attendanceLog.id)

                if (updateError) {
                    console.error(`[ADMS] Check-out update error:`, updateError)
                } else {
                    console.log(`[ADMS] Check-out recorded for ${employee.full_name} - Effective: ${effectiveHours.toFixed(2)}h`)
                }

                // Update deficit report if needed
                if (deficitHours > 0) {
                    const month = checkOutTime.getMonth() + 1
                    const year = checkOutTime.getFullYear()

                    const { data: deficitReport } = await supabase
                        .from('attendance_deficit_reports')
                        .select('*')
                        .eq('employee_id', employee.id)
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
                                employee_id: employee.id,
                                month: month,
                                year: year,
                                total_deficit_hours: deficitHours,
                                deficit_count: 1
                            })
                    }
                }
            }
        }

        // ZKTeco devices expect "OK" response
        return new NextResponse('OK', {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
            }
        })

    } catch (error) {
        console.error('[ADMS] Error processing attendance data:', error)
        // Still return OK to prevent device from retrying endlessly
        return new NextResponse('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        })
    }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    })
}
