import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StoragePageClient from './StoragePageClient'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function StoragePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile?.role !== 'owner') redirect('/dashboard')

    return (
        <DashboardLayout user={profile}>
            <StoragePageClient />
        </DashboardLayout>
    )
}
