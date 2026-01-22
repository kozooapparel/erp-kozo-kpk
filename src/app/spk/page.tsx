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

    // Fetch orders with SPK data (stages from antrean_produksi onwards)
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            customer:customers(*),
            brand:brands(*)
        `)
        .not('spk_number', 'is', null)
        .order('created_at', { ascending: false })

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Surat Perintah Kerja</h1>
                    <p className="text-slate-500">Daftar SPK untuk produksi</p>
                </div>

                {/* SPK List */}
                <SPKList orders={orders || []} />
            </div>
        </DashboardLayout>
    )
}
