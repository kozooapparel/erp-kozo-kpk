import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/invoices'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function NewInvoicePage({
    searchParams
}: {
    searchParams: Promise<{ orderId?: string; customerId?: string }>
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

    // Fetch customers
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

    // Get search params
    const params = await searchParams
    const orderId = params.orderId
    const prefilledCustomerId = params.customerId

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Buat Invoice Baru</h1>
                        <p className="text-slate-500">Buat invoice untuk customer</p>
                    </div>
                </div>

                {/* Form */}
                <InvoiceForm
                    customers={customers || []}
                    orderId={orderId}
                    prefilledCustomerId={prefilledCustomerId}
                />
            </div>
        </DashboardLayout>
    )
}
