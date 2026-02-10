'use client'

import { useState, useMemo } from 'react'
import { Order, Customer, Brand } from '@/types/database'
import { unarchiveOrder } from '@/lib/actions/orders'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ArchivedOrder extends Order {
    customer: Customer
    creator?: { id: string; full_name: string } | null
    brand?: Brand | null
}

interface OrderHistoryClientProps {
    orders: ArchivedOrder[]
}

type SortOption = 'date_desc' | 'date_asc' | 'customer_asc' | 'customer_desc'

const MONTHS = [
    { value: 0, label: 'Januari' },
    { value: 1, label: 'Februari' },
    { value: 2, label: 'Maret' },
    { value: 3, label: 'April' },
    { value: 4, label: 'Mei' },
    { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' },
    { value: 7, label: 'Agustus' },
    { value: 8, label: 'September' },
    { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' },
    { value: 11, label: 'Desember' },
]

export default function OrderHistoryClient({ orders }: OrderHistoryClientProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [restoring, setRestoring] = useState<string | null>(null)

    // Filter states
    const currentDate = new Date()
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all')
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
    const [sortBy, setSortBy] = useState<SortOption>('date_desc')

    // Get unique years from orders
    const availableYears = useMemo(() => {
        const years = new Set<number>()
        orders.forEach(order => {
            if (order.shipped_at) {
                years.add(new Date(order.shipped_at).getFullYear())
            }
        })
        // Add current year if not in list
        years.add(currentDate.getFullYear())
        return Array.from(years).sort((a, b) => b - a)
    }, [orders, currentDate])

    // Filter and sort orders
    const filteredOrders = useMemo(() => {
        let result = orders.filter(order => {
            // Search filter
            const query = searchQuery.toLowerCase()
            const matchesSearch =
                order.customer?.name?.toLowerCase().includes(query) ||
                order.nama_po?.toLowerCase().includes(query) ||
                order.tracking_number?.toLowerCase().includes(query) ||
                order.spk_number?.toLowerCase().includes(query)

            if (!matchesSearch) return false

            // Month/Year filter
            if (selectedMonth !== 'all' || selectedYear !== 'all') {
                if (!order.shipped_at) return false
                const shippedDate = new Date(order.shipped_at)

                if (selectedMonth !== 'all' && shippedDate.getMonth() !== selectedMonth) {
                    return false
                }
                if (selectedYear !== 'all' && shippedDate.getFullYear() !== selectedYear) {
                    return false
                }
            }

            return true
        })

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date_desc':
                    return new Date(b.shipped_at || 0).getTime() - new Date(a.shipped_at || 0).getTime()
                case 'date_asc':
                    return new Date(a.shipped_at || 0).getTime() - new Date(b.shipped_at || 0).getTime()
                case 'customer_asc':
                    return (a.customer?.name || '').localeCompare(b.customer?.name || '')
                case 'customer_desc':
                    return (b.customer?.name || '').localeCompare(a.customer?.name || '')
                default:
                    return 0
            }
        })

        return result
    }, [orders, searchQuery, selectedMonth, selectedYear, sortBy])

    const handleRestore = async (orderId: string) => {
        if (restoring) return

        setRestoring(orderId)
        const result = await unarchiveOrder(orderId)

        if (result.success) {
            toast.success(result.message)
            router.refresh()
        } else {
            toast.error(result.message)
        }
        setRestoring(null)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const clearFilters = () => {
        setSelectedMonth('all')
        setSelectedYear('all')
        setSearchQuery('')
        setSortBy('date_desc')
    }

    const hasActiveFilters = selectedMonth !== 'all' || selectedYear !== 'all' || searchQuery !== ''

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Riwayat Order</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {filteredOrders.length} dari {orders.length} order
                    </p>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari customer, PO, resi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-full sm:w-80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Month Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-500">Bulan:</label>
                    <select
                        value={selectedMonth === 'all' ? 'all' : selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                        <option value="all">Semua</option>
                        {MONTHS.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-500">Tahun:</label>
                    <select
                        value={selectedYear === 'all' ? 'all' : selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                        <option value="all">Semua</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-500">Urutkan:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                        <option value="date_desc">Tanggal (Terbaru)</option>
                        <option value="date_asc">Tanggal (Terlama)</option>
                        <option value="customer_asc">Customer (A-Z)</option>
                        <option value="customer_desc">Customer (Z-A)</option>
                    </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Reset Filter
                    </button>
                )}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <svg
                        className="mx-auto w-16 h-16 text-slate-300 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-700">
                        {hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada order selesai'}
                    </h3>
                    <p className="text-slate-500 mt-1">
                        {hasActiveFilters
                            ? 'Coba ubah filter atau kata kunci pencarian'
                            : 'Order yang sudah dikirim dan diarsip akan muncul di sini'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Customer
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Order
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Tanggal Kirim
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        No. Resi
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Total
                                    </th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">
                                                {order.customer?.name || '-'}
                                            </div>
                                            {order.brand && (
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {order.brand.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">
                                                {order.nama_po || order.spk_number || '-'}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {order.total_quantity} pcs
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatDate(order.shipped_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-slate-700">
                                                {order.tracking_number || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {formatCurrency(
                                                (order.dp_desain_amount || 0) +
                                                (order.dp_produksi_amount || 0) +
                                                (order.pelunasan_amount || 0)
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleRestore(order.id)}
                                                disabled={restoring === order.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {restoring === order.id ? (
                                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                )}
                                                Kembalikan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-medium text-slate-900">
                                            {order.customer?.name || '-'}
                                        </div>
                                        {order.brand && (
                                            <div className="text-xs text-slate-500">
                                                {order.brand.name}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRestore(order.id)}
                                        disabled={restoring === order.id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {restoring === order.id ? (
                                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                            </svg>
                                        )}
                                        Kembalikan
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-xs text-slate-400">Order</div>
                                        <div className="text-slate-700">
                                            {order.nama_po || order.spk_number || '-'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {order.total_quantity} pcs
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Tanggal Kirim</div>
                                        <div className="text-slate-700">
                                            {formatDate(order.shipped_at)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">No. Resi</div>
                                        <div className="font-mono text-slate-700">
                                            {order.tracking_number || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Total</div>
                                        <div className="font-medium text-slate-900">
                                            {formatCurrency(
                                                (order.dp_desain_amount || 0) +
                                                (order.dp_produksi_amount || 0) +
                                                (order.pelunasan_amount || 0)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
