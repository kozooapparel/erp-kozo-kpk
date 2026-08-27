import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BonusApprovalClient from './BonusApprovalClient'

export default async function BonusApprovalPage() {
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

    // Fetch all bonuses (pending for approval, approved for history)
    const { data: bonuses, error } = await supabase
        .from('bonuses')
        .select(`
            *,
            employee:employees(full_name, nik, department),
            creator:profiles!created_by(full_name)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bonuses:', error)
    }

    return (
        <DashboardLayout user={profile}>
            <BonusApprovalClient bonuses={bonuses || []} />
        </DashboardLayout>
    )
}
