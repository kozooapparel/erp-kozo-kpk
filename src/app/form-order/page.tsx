import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FormOrderList from '@/components/form-order/FormOrderList'
import { PageHeader } from '@/components/ui/ds'
import { hasFormOrderData } from '@/lib/form-order'

export default async function FormOrderPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: allOrders } = await supabase
        .from('orders')
        .select(`
            *,
            customer:customers(*),
            brand:brands(*)
        `)
        .order('created_at', { ascending: false })

    const { data: brands } = await supabase
        .from('brands')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

    // Tampilkan order yang punya nomor produksi atau data form order terisi
    const orders = (allOrders || []).filter(
        order => !!order.spk_number || hasFormOrderData(order)
    )

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                <PageHeader
                    title="Form Order Produksi"
                    description="Daftar form order untuk produksi"
                />

                <FormOrderList orders={orders} brands={brands || []} />
            </div>
        </DashboardLayout>
    )
}
