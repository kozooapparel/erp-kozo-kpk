import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import KanbanBoard from '@/components/kanban/KanbanBoard'

export default async function DashboardPage() {
    const supabase = await createClient()

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

    // Fetch dashboard metrics
    const { data: metrics } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .single()

    // Fetch all orders with customer info
    const { data: orders } = await supabase
        .from('orders')
        .select(`
      *,
      customer:customers(*)
    `)
        .order('created_at', { ascending: false })

    // Fetch all customers for Add Order form
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

    return (
        <DashboardLayout user={profile}>
            <KanbanBoard
                orders={orders || []}
                metrics={metrics || {
                    total_active_orders: 0,
                    total_unpaid_orders: 0,
                    total_receivables: 0,
                    bottleneck_count: 0
                }}
                customers={customers || []}
            />
        </DashboardLayout>
    )
}
