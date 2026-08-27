import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AttendanceClient from './AttendanceClient'

interface AttendanceLog {
    id: string
    employee_id: string
    date: string
    check_in: string | null
    check_out: string | null
    effective_hours: number | null
    deficit_hours: number
    forgot_checkout: boolean
    status: string
    employees: {
        full_name: string
        nik: string
        department: string
    }
}

interface PageProps {
    searchParams: Promise<{ from?: string; to?: string }>
}

export default async function AttendanceDashboard({ searchParams }: PageProps) {
    const supabase = await createClient()
    const params = await searchParams

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get date range from search params or default to today
    const today = new Date().toISOString().split('T')[0]
    const startDate = params.from || today
    const endDate = params.to || today

    // Fetch attendance for date range
    const { data: attendanceLogs, error } = await supabase
        .from('attendance_logs')
        .select(`
            *,
            employees (
                full_name,
                nik,
                department
            )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('check_in', { ascending: true })

    if (error) {
        console.error('Error fetching attendance:', error)
    }

    // Fetch all active employees to check who hasn't checked in (only for single day)
    let notCheckedIn: { id: string; full_name: string; nik: string; department: string }[] = []

    const { data: allEmployees } = await supabase
        .from('employees')
        .select('id, full_name, nik, department')
        .eq('status', 'active')

    // Only show "not checked in" for single day view (today)
    if (startDate === endDate && startDate === today) {
        const checkedInIds = new Set(attendanceLogs?.map(log => log.employee_id) || [])
        notCheckedIn = allEmployees?.filter(emp => !checkedInIds.has(emp.id)) || []
    }

    return (
        <DashboardLayout user={profile}>
            <AttendanceClient
                attendanceLogs={(attendanceLogs as AttendanceLog[]) || []}
                notCheckedIn={notCheckedIn}
                startDate={startDate}
                endDate={endDate}
                allEmployeesCount={allEmployees?.length || 0}
            />
        </DashboardLayout>
    )
}
