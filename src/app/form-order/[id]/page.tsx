import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FormOrderEditClient from '@/components/form-order/FormOrderEditClient'

export default async function FormOrderDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { id } = await params

    const { data: order } = await supabase
        .from('orders')
        .select(`
            *,
            customer:customers(*),
            brand:brands(*)
        `)
        .eq('id', id)
        .single()

    if (!order) return notFound()

    return (
        <DashboardLayout user={profile}>
            <FormOrderEditClient order={order} />
        </DashboardLayout>
    )
}
