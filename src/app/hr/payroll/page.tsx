import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PayrollListClient from './PayrollListClient'

export default async function PayrollPage() {
    const supabase = await createClient()

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

    // Fetch all payroll periods with entries count
    const { data: periods, error } = await supabase
        .from('payroll_periods')
        .select(`
            *,
            payroll_entries (count)
        `)
        .order('start_date', { ascending: false })

    if (error) {
        console.error('Error fetching payroll periods:', error)
    }

    return (
        <DashboardLayout user={profile}>
            <PayrollListClient
                periods={periods || []}
                isOwner={profile?.role === 'owner'}
            />
        </DashboardLayout>
    )
}
