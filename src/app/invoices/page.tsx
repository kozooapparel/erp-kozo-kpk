import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceList } from '@/lib/actions/invoices'
import { InvoiceList } from '@/components/invoices'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function InvoicesPage() {
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

    // Fetch invoices
    const invoices = await getInvoiceList()

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
                        <h1 className="text-2xl font-bold text-slate-900">Invoice</h1>
                        <p className="text-slate-500">Kelola invoice dan tagihan customer</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/invoices/rekap"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Rekap Invoice
                        </Link>
                        <Link
                            href="/invoices/new"
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Invoice
                        </Link>
                    </div>
                </div>

                {/* Invoice List */}
                <InvoiceList invoices={invoices} brands={brands || []} />
            </div>
        </DashboardLayout>
    )
}

