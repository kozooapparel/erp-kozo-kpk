import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OrderHistoryClient from './OrderHistoryClient'

export default async function OrderHistoryPage() {
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

    // Fetch archived orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            customer:customers(*),
            creator:profiles!created_by(id, full_name),
            brand:brands(*)
        `)
        .eq('is_archived', true)
        .order('shipped_at', { ascending: false })

    if (error) {
        console.error('Error fetching archived orders:', error)
    }

    return (
        <DashboardLayout user={profile}>
            <OrderHistoryClient orders={orders || []} />
        </DashboardLayout>
    )
}
