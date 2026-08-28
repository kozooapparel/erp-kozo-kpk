import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarangList } from '@/components/barang'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/ui/ds'

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
                <PageHeader
                    title="Master Barang"
                    description="Kelola produk dan harga tier"
                />

                {/* Barang List */}
                <BarangList />
            </div>
        </DashboardLayout>
    )
}
