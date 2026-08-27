import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import EmployeeDetailClient from './EmployeeDetailClient'

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()

    // Await params (Next.js 15 requirement)
    const { id } = await params
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

    // Fetch employee with allowances, deductions, and bonuses
    const { data: employee, error } = await supabase
        .from('employees')
        .select(`
            *,
            allowances (*),
            deductions (*),
            bonuses (*)
        `)
        .eq('id', id)
        .single()

    if (error || !employee) {
        notFound()
    }

    // Fetch attendance summary (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: attendanceLogs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

    const totalDays = attendanceLogs?.length || 0
    const totalDeficitHours = attendanceLogs?.reduce((sum, log) => sum + (log.deficit_hours || 0), 0) || 0
    const totalOvertimeHours = attendanceLogs?.reduce((sum, log) => sum + (log.overtime_hours || 0), 0) || 0

    return (
        <DashboardLayout user={profile}>
            <EmployeeDetailClient
                employee={employee}
                attendanceSummary={{
                    totalDays,
                    totalDeficitHours,
                    totalOvertimeHours
                }}
            />
        </DashboardLayout>
    )
}
