import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getKuitansiList } from '@/lib/actions/kuitansi'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import DashboardLayout from '@/components/layout/DashboardLayout'

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

    // Calculate total
    const totalPembayaran = kuitansiList.reduce((sum, k) => sum + k.jumlah, 0)

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

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-xl text-white">
                    <p className="text-sm text-emerald-100">Total Penerimaan</p>
                    <p className="text-4xl font-bold">{formatCurrency(totalPembayaran)}</p>
                    <p className="text-sm text-emerald-100 mt-1">{kuitansiList.length} transaksi</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-cyan-600 text-white">
                                <tr>
                                    <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">No</th>
                                    <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Tanggal</th>
                                    <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">No Invoice</th>
                                    <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Customer</th>
                                    <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">Jumlah</th>
                                    <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {kuitansiList.map((k, index) => (
                                    <tr key={k.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">{index + 1}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDateShort(k.tanggal)}</td>
                                        <td className="px-6 py-4 font-medium text-cyan-600">
                                            <Link href={`/invoices/${k.invoice?.id}`} className="hover:underline">
                                                {k.invoice?.no_invoice}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{k.invoice?.customer?.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(k.jumlah)}</td>
                                        <td className="px-6 py-4 text-slate-600">{k.keterangan}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 font-bold text-slate-900 text-right">TOTAL</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(totalPembayaran)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
