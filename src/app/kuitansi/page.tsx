import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUnpaidInvoices } from '@/lib/actions/invoices'
import { getKuitansiList } from '@/lib/actions/kuitansi'
import { KuitansiForm, KuitansiList } from '@/components/kuitansi'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function KuitansiPage({
    searchParams
}: {
    searchParams: Promise<{ invoiceId?: string; mode?: string }>
}) {
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

    // Get search params
    const params = await searchParams
    const prefilledInvoiceId = params.invoiceId
    const mode = params.mode || 'list'

    // Fetch data
    const [unpaidInvoices, kuitansiList] = await Promise.all([
        getUnpaidInvoices(),
        getKuitansiList()
    ])

    // Fetch active brands for filter dropdown
    const { data: brands } = await supabase
        .from('brands')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Kuitansi</h1>
                        <p className="text-slate-500">Kelola bukti pembayaran</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/kuitansi/rekap"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Rekap Kuitansi
                        </Link>
                        <Link
                            href={mode === 'new' ? '/kuitansi' : '/kuitansi?mode=new'}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {mode === 'new' ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    Lihat List
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Buat Kuitansi
                                </>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {mode === 'new' ? (
                    <KuitansiForm
                        unpaidInvoices={unpaidInvoices}
                        prefilledInvoiceId={prefilledInvoiceId}
                    />
                ) : (
                    <KuitansiList kuitansiList={kuitansiList} brands={brands || []} />
                )}
            </div>
        </DashboardLayout>
    )
}
