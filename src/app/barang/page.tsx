import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarangList } from '@/components/barang'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function BarangPage() {
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

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Master Barang</h1>
                    <p className="text-slate-500">Kelola produk dan harga tier</p>
                </div>

                {/* Barang List */}
                <BarangList />
            </div>
        </DashboardLayout>
    )
}
