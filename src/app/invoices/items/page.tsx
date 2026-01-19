import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceItemsRekap } from '@/lib/actions/invoices'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function RekapInvoiceItemPage() {
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

    // Fetch all invoice items
    const items = await getInvoiceItemsRekap()

    // Calculate total
    const totalSubTotal = items.reduce((sum, item) => sum + item.sub_total, 0)
    const totalQty = items.reduce((sum, item) => sum + item.jumlah, 0)

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Rekap Invoice Item</h1>
                        <p className="text-slate-500">Detail item dari seluruh invoice</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/invoices/rekap"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Rekap Total
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Item</p>
                        <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Quantity</p>
                        <p className="text-2xl font-bold text-blue-600">{totalQty.toLocaleString('id-ID')} pcs</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Nilai</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSubTotal)}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                                <tr>
                                    <th className="text-left font-medium px-4 py-3">No Invoice</th>
                                    <th className="text-left font-medium px-4 py-3">Tgl Invoice</th>
                                    <th className="text-left font-medium px-4 py-3">Customer</th>
                                    <th className="text-center font-medium px-4 py-3">Item No</th>
                                    <th className="text-left font-medium px-4 py-3">Nama Barang</th>
                                    <th className="text-right font-medium px-4 py-3">Jumlah</th>
                                    <th className="text-center font-medium px-4 py-3">Satuan</th>
                                    <th className="text-right font-medium px-4 py-3">Harga Satuan</th>
                                    <th className="text-right font-medium px-4 py-3">Sub Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, index) => (
                                    <tr key={`${item.id}-${index}`} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-violet-600">
                                            <Link href={`/invoices/${item.invoice?.id}`} className="hover:underline">
                                                {item.invoice?.no_invoice}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {formatDateShort(item.invoice?.tanggal)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {item.invoice?.customer?.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600">{item.item_no}</td>
                                        <td className="px-4 py-3 text-slate-900">{item.deskripsi}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{item.jumlah.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-center text-slate-600">{item.satuan}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.harga_satuan)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(item.sub_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100">
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 font-bold text-slate-900">TOTAL</td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-600">{totalQty.toLocaleString('id-ID')}</td>
                                    <td></td>
                                    <td></td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(totalSubTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
