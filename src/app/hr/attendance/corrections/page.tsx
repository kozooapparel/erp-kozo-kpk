import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CorrectionsList from './CorrectionsList'

export default async function AttendanceCorrectionsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check if owner
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner') {
        redirect('/dashboard')
    }

    // Fetch last 30 days attendance
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: logs, error } = await supabase
        .from('attendance_logs')
        .select(`
            *,
            employee:employees(full_name, nik, department)
        `)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching attendance logs:', error)
    }

    return (
        <DashboardLayout user={profile}>
            <CorrectionsList logs={logs || []} />
        </DashboardLayout>
    )
}
