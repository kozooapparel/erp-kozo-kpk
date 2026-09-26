import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getKuitansiList } from '@/lib/actions/kuitansi'
import DashboardLayout from '@/components/layout/DashboardLayout'
import RekapKuitansiTable from '@/components/kuitansi/RekapKuitansiTable'

export default async function RekapKuitansiPage() {
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

    // Fetch all kuitansi
    const kuitansiList = await getKuitansiList()

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Rekap Kuitansi</h1>
                        <p className="text-slate-500">Ringkasan seluruh pembayaran</p>
                    </div>
                    <Link
                        href="/kuitansi"
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Kembali
                    </Link>
                </div>

                <RekapKuitansiTable kuitansiList={kuitansiList} />
            </div>
        </DashboardLayout>
    )
}
