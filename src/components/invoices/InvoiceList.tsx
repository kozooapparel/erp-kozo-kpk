'use client'

import Link from 'next/link'
import { useState } from 'react'
import { InvoiceWithCustomer } from '@/types/database'
import { deleteInvoice } from '@/lib/actions/invoices'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'
import InvoiceDownloadButton from './InvoiceDownloadButton'
import { toast } from 'sonner'

interface BrandItem {
    id: string
    code: string
    name: string
}

interface InvoiceListProps {
    invoices: InvoiceWithCustomer[]
    brands: BrandItem[]
}

export default function InvoiceList({ invoices, brands }: InvoiceListProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'BELUM_LUNAS' | 'SUDAH_LUNAS'>('all')
    const [search, setSearch] = useState('')
    const [brandFilter, setBrandFilter] = useState<string>('all')

    const filteredInvoices = invoices.filter(inv => {
        const matchStatus = filter === 'all' || inv.status_pembayaran === filter
        const matchSearch = search === '' ||
            inv.no_invoice.toLowerCase().includes(search.toLowerCase()) ||
            inv.customer?.name.toLowerCase().includes(search.toLowerCase())
        const matchBrand = brandFilter === 'all' || (inv as any).brand?.id === brandFilter
        return matchStatus && matchSearch && matchBrand
    })

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus invoice ini? Semua data terkait akan dihapus.')) return

        setLoading(id)
        try {
            await deleteInvoice(id)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Gagal menghapus invoice')
        } finally {
            setLoading(null)
        }
    }

    // Calculate summaries
    const totalInvoice = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalDibayar = filteredInvoices.reduce((sum, inv) => sum + inv.total_dibayar, 0)
    const totalSisa = filteredInvoices.reduce((sum, inv) => sum + inv.sisa_tagihan, 0)

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Invoice</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalInvoice)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Dibayar</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDibayar)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Sisa Tagihan</p>
                    <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalSisa)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari no invoice atau customer..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => setFilter('BELUM_LUNAS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'BELUM_LUNAS'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            }`}
                    >
                        Belum Lunas
                    </button>
                    <button
                        onClick={() => setFilter('SUDAH_LUNAS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'SUDAH_LUNAS'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                    >
                        Lunas
                    </button>
                </div>

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
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className={`pl-8 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all appearance-none cursor-pointer ${brandFilter !== 'all'
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

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">No Invoice</th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tanggal</th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Customer</th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Dibayar</th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Sisa</th>
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        Tidak ada invoice ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            <Link href={`/invoices/${invoice.id}`} className="hover:text-orange-500">
                                                {invoice.no_invoice}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatDateShort(invoice.tanggal)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            <div className="flex items-center gap-2">
                                                {invoice.customer?.name || '-'}
                                                {(invoice as any).brand?.code && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                        {(invoice as any).brand.code}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-emerald-600 text-right">
                                            {formatCurrency(invoice.total_dibayar)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-orange-500 text-right font-medium">
                                            {formatCurrency(invoice.sisa_tagihan)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status_pembayaran === 'SUDAH_LUNAS'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {invoice.status_pembayaran === 'SUDAH_LUNAS' ? '🟢 LUNAS' : '🟠 BELUM LUNAS'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <InvoiceDownloadButton
                                                    invoiceId={invoice.id}
                                                    variant="icon"
                                                />
                                                <Link
                                                    href={`/invoices/${invoice.id}`}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Lihat/Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(invoice.id)}
                                                    disabled={loading === invoice.id}
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
