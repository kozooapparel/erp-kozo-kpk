import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UserManagement from '@/components/users/UserManagement'
import { getAdminUsers } from './actions'

export default async function UsersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch profile and verify owner role
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Only owners can access this page
    if (profile?.role !== 'owner') {
        redirect('/dashboard')
    }

    // Fetch admin users
    const adminUsers = await getAdminUsers()

    return (
        <DashboardLayout user={profile}>
            <UserManagement adminUsers={adminUsers} />
        </DashboardLayout>
    )
}
