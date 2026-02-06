import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PayrollDetailClient from './PayrollDetailClient'

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    // Fetch payroll period with entries
    const { data: period, error } = await supabase
        .from('payroll_periods')
        .select(`
            *,
            payroll_entries (
                *,
                employees (
                    nik,
                    full_name,
                    department,
                    position
                )
            )
        `)
        .eq('id', id)
        .single()

    if (error || !period) {
        notFound()
    }

    return (
        <DashboardLayout user={profile}>
            <PayrollDetailClient
                period={period}
                isOwner={profile?.role === 'owner'}
            />
        </DashboardLayout>
    )
}
