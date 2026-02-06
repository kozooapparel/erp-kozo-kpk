import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Bioclock Push SDK Webhook Endpoint
 * 
 * Bio Finger AT-301 sends JSON data in this format:
 * {
 *   "biohook": "clockreco",
 *   "biopush": {
 *     "device": "GED7244800483",
 *     "biokey": "xxx"
 *   },
 *   "biodata": {
 *     "tran_id": "1668143408",
 *     "user_id": "123",
 *     "disp_nm": "TESTING",
 *     "tran_dt": "2022-06-24 08:42:01",
 *     "stateid": "0",  // 0=masuk, 1=pulang, 255=selamat datang
 *     "verify": "15",
 *     "workcod": "",
 *     "is_mask": "0",
 *     "bodytem": "0.00"
 *   }
 * }
 */

interface BioclockPayload {
    biohook: string
    biopush?: {
        device: string
        biokey: string
    }
    biodata: {
        tran_id?: string
        user_id: string
        disp_nm?: string
        tran_dt: string
        stateid: string
        verify?: string
        workcod?: string
        is_mask?: string
        bodytem?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: BioclockPayload = await request.json()

        console.log('[Bioclock] Received webhook:', JSON.stringify(body, null, 2))

        // Only process clockreco (attendance record)
        if (body.biohook !== 'clockreco') {
            console.log(`[Bioclock] Ignoring non-clockreco biohook: ${body.biohook}`)
            return new NextResponse('OK', { status: 200 })
        }

        const { biodata, biopush } = body
        const deviceSn = biopush?.device || 'unknown'

        // Parse user_id (this is the NIK)
        const nik = biodata.user_id
        const transactionTime = biodata.tran_dt // Format: "2022-06-24 08:42:01"
        const stateId = biodata.stateid

        // Determine event type from stateid
        // 0=masuk, 1=pulang, 255=selamat datang (treat as check-in)
        let event: 'check_in' | 'check_out'
        if (stateId === '1') {
            event = 'check_out'
        } else {
            event = 'check_in' // 0 or 255
        }

        console.log(`[Bioclock] Processing ${event} for NIK: ${nik} at ${transactionTime}`)

        const supabase = await createClient()

        // Find employee by NIK
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('id, full_name, nik, status')
            .eq('nik', nik)
            .eq('status', 'active')
            .single()

        if (employeeError || !employee) {
            console.log(`[Bioclock] Employee not found for NIK: ${nik}`)
            return new NextResponse('OK', { status: 200 })
        }

        // Parse datetime (format: YYYY-MM-DD HH:MM:SS)
        const checkTime = new Date(transactionTime.replace(' ', 'T') + '+07:00') // Assume WIB
        const dateStr = checkTime.toISOString().split('T')[0]

        console.log(`[Bioclock] Found employee: ${employee.full_name}, Date: ${dateStr}`)

        if (event === 'check_in') {
            // Check if there's already a check-in for today
            const { data: existingLog } = await supabase
                .from('attendance_logs')
                .select('id')
                .eq('employee_id', employee.id)
                .eq('date', dateStr)
                .single()

            if (existingLog) {
                console.log(`[Bioclock] Already checked in today: ${employee.full_name}`)
                return new NextResponse('OK', { status: 200 })
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
                    device_sn: deviceSn
                })

            if (insertError) {
                console.error(`[Bioclock] Check-in insert error:`, insertError)
            } else {
                console.log(`[Bioclock] ✅ Check-in recorded for ${employee.full_name}`)
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
                console.log(`[Bioclock] No check-in found for today: ${employee.full_name}`)
                return new NextResponse('OK', { status: 200 })
            }

            if (attendanceLog.check_out) {
                console.log(`[Bioclock] Already checked out today: ${employee.full_name}`)
                return new NextResponse('OK', { status: 200 })
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
                    device_sn: deviceSn
                })
                .eq('id', attendanceLog.id)

            if (updateError) {
                console.error(`[Bioclock] Check-out update error:`, updateError)
            } else {
                console.log(`[Bioclock] ✅ Check-out recorded for ${employee.full_name} - Effective: ${effectiveHours.toFixed(2)}h`)
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

        // Bioclock expects "OK" response
        return new NextResponse('OK', { status: 200 })

    } catch (error) {
        console.error('[Bioclock] Error processing webhook:', error)
        return new NextResponse('OK', { status: 200 })
    }
}

// GET request for testing
export async function GET() {
    return new NextResponse('Bioclock Webhook Endpoint Active', { status: 200 })
}

// OPTIONS for CORS
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
