import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceList } from '@/lib/actions/invoices'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import DashboardLayout from '@/components/layout/DashboardLayout'

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

    // Calculate summaries
    const totalInvoice = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalDibayar = invoices.reduce((sum, inv) => sum + inv.total_dibayar, 0)
    const totalSisa = invoices.reduce((sum, inv) => sum + inv.sisa_tagihan, 0)
    const countLunas = invoices.filter(inv => inv.status_pembayaran === 'SUDAH_LUNAS').length
    const countBelum = invoices.filter(inv => inv.status_pembayaran === 'BELUM_LUNAS').length

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

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Invoice</p>
                        <p className="text-xl font-bold text-slate-900">{invoices.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Nilai Invoice</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(totalInvoice)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Dibayar</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalDibayar)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Sisa Tagihan</p>
                        <p className="text-xl font-bold text-orange-500">{formatCurrency(totalSisa)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="text-sm">
                            <span className="text-emerald-600 font-medium">🟢 {countLunas} Lunas</span>
                            <span className="mx-2">|</span>
                            <span className="text-orange-500 font-medium">🟠 {countBelum} Belum</span>
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                                <tr>
                                    <th className="text-left font-medium px-4 py-3">No Invoice</th>
                                    <th className="text-left font-medium px-4 py-3">Tgl Invoice</th>
                                    <th className="text-left font-medium px-4 py-3">Termin</th>
                                    <th className="text-left font-medium px-4 py-3">Jatuh Tempo</th>
                                    <th className="text-left font-medium px-4 py-3">No PO</th>
                                    <th className="text-left font-medium px-4 py-3">Customer</th>
                                    <th className="text-left font-medium px-4 py-3">Alamat</th>
                                    <th className="text-left font-medium px-4 py-3">Telpon</th>
                                    <th className="text-right font-medium px-4 py-3">Sub Total</th>
                                    <th className="text-right font-medium px-4 py-3">Pajak</th>
                                    <th className="text-right font-medium px-4 py-3">Total</th>
                                    <th className="text-right font-medium px-4 py-3">Pembayaran</th>
                                    <th className="text-right font-medium px-4 py-3">Sisa</th>
                                    <th className="text-center font-medium px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((inv) => {
                                    // Calculate jatuh tempo
                                    const jatuhTempo = new Date(inv.tanggal)
                                    jatuhTempo.setDate(jatuhTempo.getDate() + (inv.termin_pembayaran || 0))

                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-blue-600">
                                                <Link href={`/invoices/${inv.id}`} className="hover:underline">
                                                    {inv.no_invoice}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateShort(inv.tanggal)}</td>
                                            <td className="px-4 py-3 text-slate-600">{inv.termin_pembayaran} hari</td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateShort(jatuhTempo)}</td>
                                            <td className="px-4 py-3 text-slate-600">{inv.no_po || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{inv.customer?.name}</td>
                                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{inv.customer?.alamat || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{inv.customer?.phone}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.sub_total)}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.ppn_amount)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(inv.total)}</td>
                                            <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(inv.total_dibayar)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-orange-500">{formatCurrency(inv.sisa_tagihan)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${inv.status_pembayaran === 'SUDAH_LUNAS'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {inv.status_pembayaran === 'SUDAH_LUNAS' ? '🟢 LUNAS' : '🟠 BELUM'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
