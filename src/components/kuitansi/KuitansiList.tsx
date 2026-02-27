'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KuitansiWithInvoice } from '@/types/database'
import { deleteKuitansi } from '@/lib/actions/kuitansi'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import KuitansiDownloadButton from './KuitansiDownloadButton'
import { toast } from 'sonner'

interface BrandItem {
    id: string
    code: string
    name: string
}

interface KuitansiListProps {
    kuitansiList: KuitansiWithInvoice[]
    brands: BrandItem[]
}

export default function KuitansiList({ kuitansiList, brands }: KuitansiListProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [brandFilter, setBrandFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'BELUM_LUNAS' | 'SUDAH_LUNAS'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 20

    const filteredList = kuitansiList.filter(k => {
        const matchSearch = search === '' ||
            k.invoice?.no_invoice.toLowerCase().includes(search.toLowerCase()) ||
            k.invoice?.customer?.name.toLowerCase().includes(search.toLowerCase())
        const matchBrand = brandFilter === 'all' || (k.invoice as any)?.brand?.id === brandFilter
        const matchStatus = statusFilter === 'all' || k.invoice?.status_pembayaran === statusFilter
        return matchSearch && matchBrand && matchStatus
    })

    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE)
    const paginatedList = filteredList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

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

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                    placeholder="Cari no invoice atau customer..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />

                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
                    {/* Status Filter */}
                    <button
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1) }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => { setStatusFilter('BELUM_LUNAS'); setCurrentPage(1) }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === 'BELUM_LUNAS'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            }`}
                    >
                        Inv. Belum Lunas
                    </button>
                    <button
                        onClick={() => { setStatusFilter('SUDAH_LUNAS'); setCurrentPage(1) }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === 'SUDAH_LUNAS'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                    >
                        Inv. Lunas
                    </button>

                    {/* Brand Filter Dropdown */}
                    <div className="relative flex items-center">
                        <svg
                            className={`absolute left-2.5 w-4 h-4 pointer-events-none transition-colors ${brandFilter !== 'all' ? 'text-white' : 'text-slate-500'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <select
                            value={brandFilter}
                            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1) }}
                            className={`pl-8 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all appearance-none cursor-pointer ${brandFilter !== 'all'
                                ? 'bg-slate-700 text-white border-slate-700 font-semibold'
                                : 'bg-white text-slate-700 border-slate-200'
                                }`}
                        >
                            <option value="all" className="bg-white text-slate-700">Semua Brand</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id} className="bg-white text-slate-700">
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        <svg
                            className={`absolute right-2 w-4 h-4 pointer-events-none transition-colors ${brandFilter !== 'all' ? 'text-white' : 'text-slate-400'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
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
                                paginatedList.map((kuitansi, index) => (
                                    <tr key={kuitansi.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} dari {filteredList.length} kuitansi
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 text-sm rounded-lg transition-colors ${page === currentPage
                                    ? 'bg-emerald-500 text-white font-semibold'
                                    : 'hover:bg-slate-100 text-slate-600'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
