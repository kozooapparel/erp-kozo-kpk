import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceList } from '@/lib/actions/invoices'
import { InvoiceList } from '@/components/invoices'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/ui/ds'

const Icon = {
    Plus: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    ),
    ChartBar: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
}

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
                <PageHeader
                    title="Invoice"
                    description="Kelola invoice dan tagihan customer"
                    actions={
                        <>
                            <Link href="/invoices/rekap" className="btn-secondary">
                                <Icon.ChartBar className="w-4 h-4" />
                                <span className="hidden sm:inline">Rekap Invoice</span>
                                <span className="sm:hidden">Rekap</span>
                            </Link>
                            <Link href="/invoices/new" className="btn-primary">
                                <Icon.Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Buat Invoice</span>
                                <span className="sm:hidden">Buat</span>
                            </Link>
                        </>
                    }
                />

                {/* Invoice List */}
                <InvoiceList invoices={invoices} brands={brands || []} />
            </div>
        </DashboardLayout>
    )
}
