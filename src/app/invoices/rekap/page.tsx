import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceList } from '@/lib/actions/invoices'
import DashboardLayout from '@/components/layout/DashboardLayout'
import RekapInvoiceTable from '@/components/invoices/RekapInvoiceTable'

export default async function RekapInvoicePage() {
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

    // Fetch all invoices
    const invoices = await getInvoiceList()

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Rekap Invoice Total</h1>
                        <p className="text-slate-500">Ringkasan seluruh invoice</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/invoices/items"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Rekap Item
                        </Link>
                        <Link
                            href="/invoices"
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Kembali
                        </Link>
                    </div>
                </div>

                <RekapInvoiceTable invoices={invoices} />
            </div>
        </DashboardLayout>
    )
}
