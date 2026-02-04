import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getInvoiceById } from '@/lib/actions/invoices'
import { InvoiceForm } from '@/components/invoices'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function EditInvoicePage({
    params
}: {
    params: Promise<{ id: string }>
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

    // Get invoice ID
    const { id } = await params

    // Fetch invoice
    const invoice = await getInvoiceById(id)
    if (!invoice) return notFound()

    // Fetch customers
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                        <p className="text-slate-500">{invoice.no_invoice}</p>
                    </div>
                </div>

                {/* Form */}
                <InvoiceForm
                    customers={customers || []}
                    invoice={invoice}
                    prefilledBrandId={invoice.brand_id || undefined}
                />
            </div>
        </DashboardLayout>
    )
}
