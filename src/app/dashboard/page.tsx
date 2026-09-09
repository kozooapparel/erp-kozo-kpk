import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import KanbanBoardWrapper from '@/components/kanban/KanbanBoardWrapper'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [
        { data: profile },
        { data: metrics },
        { data: orders },
        { data: customers },
        { data: admins },
        { data: brands },
    ] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
        supabase
            .from('dashboard_metrics')
            .select('*')
            .single(),
        supabase
            .from('orders')
            .select(`
                *,
                invoices(id),
                customer:customers(*),
                creator:profiles!created_by(id, full_name),
                brand:brands(*)
            `)
            .eq('is_archived', false)
            .order('created_at', { ascending: false }),
        supabase
            .from('customers')
            .select('*')
            .order('name', { ascending: true }),
        supabase
            .from('profiles')
            .select('id, full_name')
            .order('full_name', { ascending: true }),
        supabase
            .from('brands')
            .select('id, code, name')
            .eq('is_active', true)
            .order('name', { ascending: true }),
    ])

    return (
        <DashboardLayout user={profile}>
            <KanbanBoardWrapper
                orders={orders || []}
                metrics={metrics || {
                    total_active_orders: 0,
                    total_unpaid_orders: 0,
                    total_receivables: 0,
                    bottleneck_count: 0
                }}
                customers={customers || []}
                admins={admins || []}
                brands={brands || []}
            />
        </DashboardLayout>
    )
}
