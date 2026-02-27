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

interface BrandItem {
    id: string
    code: string
    name: string
}

interface OrderHistoryClientProps {
    orders: ArchivedOrder[]
    brands: BrandItem[]
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

export default function OrderHistoryClient({ orders, brands }: OrderHistoryClientProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [restoring, setRestoring] = useState<string | null>(null)
    const [selectedDetail, setSelectedDetail] = useState<string | null>(null)

    // Filter states
    const currentDate = new Date()
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all')
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
    const [brandFilter, setBrandFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<SortOption>('date_desc')
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 20

    // Get unique years from orders
    const availableYears = useMemo(() => {
        const years = new Set<number>()
        orders.forEach(order => {
            if (order.shipped_at) {
                years.add(new Date(order.shipped_at).getFullYear())
            }
        })
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

            // Brand filter
            if (brandFilter !== 'all' && order.brand_id !== brandFilter) return false

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
    }, [orders, searchQuery, selectedMonth, selectedYear, brandFilter, sortBy])

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Summary stats (reactive to filters)
    const totalQty = filteredOrders.reduce((sum, o) => sum + (o.total_quantity || 0), 0)
    const totalRevenue = filteredOrders.reduce((sum, o) =>
        sum + (o.dp_desain_amount || 0) + (o.dp_produksi_amount || 0) + (o.pelunasan_amount || 0)
        , 0)

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
        setBrandFilter('all')
        setSearchQuery('')
        setSortBy('date_desc')
        setCurrentPage(1)
    }

    const hasActiveFilters = selectedMonth !== 'all' || selectedYear !== 'all' || searchQuery !== '' || brandFilter !== 'all'

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
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                        className="pl-10 pr-4 py-2.5 w-full sm:w-80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Order Selesai</p>
                    <p className="text-2xl font-bold text-slate-900">{filteredOrders.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Quantity</p>
                    <p className="text-2xl font-bold text-blue-600">{totalQty.toLocaleString('id-ID')} pcs</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Dibayar</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            {/* Filters Row — compact, no labels */}
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={selectedMonth === 'all' ? 'all' : selectedMonth}
                    onChange={(e) => { setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCurrentPage(1) }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white cursor-pointer"
                >
                    <option value="all">Semua Bulan</option>
                    {MONTHS.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                </select>

                <select
                    value={selectedYear === 'all' ? 'all' : selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCurrentPage(1) }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white cursor-pointer"
                >
                    <option value="all">Semua Tahun</option>
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                {/* Brand Filter */}
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
                        className={`pl-8 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all appearance-none cursor-pointer ${brandFilter !== 'all'
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

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white cursor-pointer"
                >
                    <option value="date_desc">Terbaru</option>
                    <option value="date_asc">Terlama</option>
                    <option value="customer_asc">Customer A-Z</option>
                    <option value="customer_desc">Customer Z-A</option>
                </select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Reset
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
                            <thead className="bg-red-600 text-white">
                                <tr>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-4">
                                        Customer
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-4">
                                        Order
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-4">
                                        Tanggal Kirim
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-4">
                                        No. Resi
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-4">
                                        Total Dibayar
                                    </th>
                                    <th className="text-center text-xs font-semibold uppercase tracking-wider px-6 py-4">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedDetail(selectedDetail === order.id ? null : order.id)}
                                                className="text-left hover:text-red-600 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900 hover:text-red-600">
                                                        {order.customer?.name || '-'}
                                                    </span>
                                                    {order.brand && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                            {order.brand.code || order.brand.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
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
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedDetail(selectedDetail === order.id ? null : order.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Detail"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Detail
                                                </button>
                                                <button
                                                    onClick={() => handleRestore(order.id)}
                                                    disabled={restoring === order.id}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Expandable Detail Row (inline) */}
                    {selectedDetail && (() => {
                        const order = filteredOrders.find(o => o.id === selectedDetail)
                        if (!order) return null
                        return (
                            <div className="hidden md:block border-t border-slate-200 bg-slate-50 px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-slate-900">Detail Order — {order.customer?.name}</h4>
                                    <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">SPK Number</span>
                                        <p className="font-medium text-slate-900 font-mono">{order.spk_number || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">PO Name</span>
                                        <p className="font-medium text-slate-900">{order.nama_po || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Brand</span>
                                        <p className="font-medium text-slate-900">{order.brand?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Quantity</span>
                                        <p className="font-medium text-slate-900">{order.total_quantity} pcs</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">DP Desain</span>
                                        <p className="font-medium text-slate-900">{formatCurrency(order.dp_desain_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">DP Produksi</span>
                                        <p className="font-medium text-slate-900">{formatCurrency(order.dp_produksi_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Pelunasan</span>
                                        <p className="font-medium text-slate-900">{formatCurrency(order.pelunasan_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Tanggal Kirim</span>
                                        <p className="font-medium text-slate-900">{formatDate(order.shipped_at)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">No. Resi</span>
                                        <p className="font-medium text-slate-900 font-mono">{order.tracking_number || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Dibuat Oleh</span>
                                        <p className="font-medium text-slate-900">{order.creator?.full_name || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Deadline</span>
                                        <p className="font-medium text-slate-900">{formatDate(order.deadline)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Catatan</span>
                                        <p className="font-medium text-slate-900">{order.production_notes || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {paginatedOrders.map((order) => (
                            <div key={order.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900">
                                                {order.customer?.name || '-'}
                                            </span>
                                            {order.brand && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                    {order.brand.code || order.brand.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setSelectedDetail(selectedDetail === order.id ? null : order.id)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleRestore(order.id)}
                                            disabled={restoring === order.id}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
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
                                </div>

                                {/* Mobile detail panel */}
                                {selectedDetail === order.id && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="text-slate-400 text-xs">SPK</span><p className="text-slate-700 font-mono">{order.spk_number || '-'}</p></div>
                                            <div><span className="text-slate-400 text-xs">PO</span><p className="text-slate-700">{order.nama_po || '-'}</p></div>
                                            <div><span className="text-slate-400 text-xs">DP Desain</span><p className="text-slate-700">{formatCurrency(order.dp_desain_amount || 0)}</p></div>
                                            <div><span className="text-slate-400 text-xs">DP Produksi</span><p className="text-slate-700">{formatCurrency(order.dp_produksi_amount || 0)}</p></div>
                                            <div><span className="text-slate-400 text-xs">Pelunasan</span><p className="text-slate-700">{formatCurrency(order.pelunasan_amount || 0)}</p></div>
                                            <div><span className="text-slate-400 text-xs">Dibuat Oleh</span><p className="text-slate-700">{order.creator?.full_name || '-'}</p></div>
                                        </div>
                                        {order.production_notes && (
                                            <div><span className="text-slate-400 text-xs">Catatan</span><p className="text-slate-700">{order.production_notes}</p></div>
                                        )}
                                    </div>
                                )}

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
                                        <div className="text-xs text-slate-400">Total Dibayar</div>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} dari {filteredOrders.length} order
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
                                    ? 'bg-red-500 text-white font-semibold'
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
