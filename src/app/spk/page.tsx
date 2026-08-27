import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SPKList from '@/components/spk/SPKList'

export default async function SPKPage() {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch profile for layout
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch orders with SPK data (either spk_number generated OR spk_sections/size_breakdown filled)
    const { data: allOrders } = await supabase
        .from('orders')
        .select(`
            *,
            customer:customers(*),
            brand:brands(*)
        `)
        .order('created_at', { ascending: false })

    // Fetch active brands for filter dropdown
    const { data: brands } = await supabase
        .from('brands')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

    // Filter to only include orders with valid SPK data:
    // 1. Has spk_number (already in production queue or beyond), OR
    // 2. Has spk_sections with data, OR
    // 3. Has size_breakdown with actual data (not empty object)
    const orders = (allOrders || []).filter(order => {
        // Has SPK number - definitely valid
        if (order.spk_number) return true

        // Has SPK sections with data
        if (order.spk_sections && Array.isArray(order.spk_sections) && order.spk_sections.length > 0) return true

        // Has size_breakdown with actual data (not just empty object)
        if (order.size_breakdown && typeof order.size_breakdown === 'object') {
            const entries = Object.entries(order.size_breakdown)
            // Check if there are entries AND at least one has qty > 0
            if (entries.length > 0) {
                const hasValidQty = entries.some(([_, qty]) => typeof qty === 'number' && qty > 0)
                if (hasValidQty) return true
            }
        }

        return false
    })

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Surat Perintah Kerja</h1>
                    <p className="text-slate-500">Daftar SPK untuk produksi</p>
                </div>

                {/* SPK List */}
                <SPKList orders={orders || []} brands={brands || []} />
            </div>
        </DashboardLayout>
    )
}
