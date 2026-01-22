'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KuitansiWithInvoice } from '@/types/database'
import { deleteKuitansi } from '@/lib/actions/kuitansi'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import KuitansiDownloadButton from './KuitansiDownloadButton'
import { toast } from 'sonner'

interface KuitansiListProps {
    kuitansiList: KuitansiWithInvoice[]
}

export default function KuitansiList({ kuitansiList }: KuitansiListProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    const filteredList = kuitansiList.filter(k => {
        const matchSearch = search === '' ||
            k.invoice?.no_invoice.toLowerCase().includes(search.toLowerCase()) ||
            k.invoice?.customer?.name.toLowerCase().includes(search.toLowerCase())
        return matchSearch
    })

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus kuitansi ini? Status pembayaran invoice akan diupdate.')) return

        setLoading(id)
        try {
            await deleteKuitansi(id)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Gagal menghapus kuitansi')
        } finally {
            setLoading(null)
        }
    }

    // Calculate total
    const totalPembayaran = filteredList.reduce((sum, k) => sum + k.jumlah, 0)

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-xl text-white">
                <p className="text-sm text-emerald-100">Total Pembayaran</p>
                <p className="text-3xl font-bold">{formatCurrency(totalPembayaran)}</p>
                <p className="text-sm text-emerald-100 mt-1">{filteredList.length} kuitansi</p>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari no invoice atau customer..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-cyan-600 text-white">
                            <tr>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">No</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Tanggal</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">No Invoice</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Customer</th>
                                <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">Jumlah</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Keterangan</th>
                                <th className="text-center text-xs font-medium uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Tidak ada kuitansi ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((kuitansi, index) => (
                                    <tr key={kuitansi.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatDateShort(kuitansi.tanggal)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {kuitansi.invoice?.no_invoice || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                {kuitansi.invoice?.customer?.name || '-'}
                                                {(kuitansi.invoice as any)?.brand?.code && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                        {(kuitansi.invoice as any).brand.code}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600">
                                            {formatCurrency(kuitansi.jumlah)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                            {kuitansi.keterangan}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <KuitansiDownloadButton
                                                    kuitansiId={kuitansi.id}
                                                    variant="icon"
                                                />
                                                <button
                                                    onClick={() => handleDelete(kuitansi.id)}
                                                    disabled={loading === kuitansi.id}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Hapus"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
