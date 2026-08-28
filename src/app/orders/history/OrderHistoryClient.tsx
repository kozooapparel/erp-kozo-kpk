'use client'

import { useState, useMemo } from 'react'
import { Order, Customer, Brand } from '@/types/database'
import { unarchiveOrder } from '@/lib/actions/orders'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PageHeader, EmptyState, DefaultEmptyIcon, StatCard } from '@/components/ui/ds'

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

// Icons (Heroicons v2, strokeWidth 1.7)
const Icon = {
    Search: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    ),
    Tag: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
    ),
    Eye: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    ArrowUturn: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
    ),
    Archive: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
    ),
    X: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Spinner: (p: { className?: string }) => (
        <svg className={`${p.className} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    ),
}

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
            <PageHeader
                title="Riwayat Order"
                description={`${filteredOrders.length} dari ${orders.length} order telah selesai`}
                badge={
                    <span className="badge badge-neutral">
                        <Icon.Archive className="w-3 h-3 mr-1" />
                        Arsip
                    </span>
                }
                actions={
                    <div className="relative w-full sm:w-80">
                        <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari customer, PO, resi..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="input pl-9 w-full"
                            aria-label="Cari order"
                        />
                    </div>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                    label="Total Order Selesai"
                    value={filteredOrders.length}
                    tone="brand"
                />
                <StatCard
                    label="Total Quantity"
                    value={`${totalQty.toLocaleString('id-ID')} pcs`}
                    tone="info"
                />
                <StatCard
                    label="Total Dibayar"
                    value={formatCurrency(totalRevenue)}
                    tone="success"
                />
            </div>

            {/* Filters Row — compact with small labels */}
            <div className="surface p-4 grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                {/* Bulan */}
                <div>
                    <label htmlFor="filter-bulan" className="label text-[11px] mb-1 block text-slate-500">Bulan</label>
                    <select
                        id="filter-bulan"
                        value={selectedMonth === 'all' ? 'all' : selectedMonth}
                        onChange={(e) => { setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCurrentPage(1) }}
                        className="input w-full"
                        aria-label="Filter bulan"
                    >
                        <option value="all">Semua</option>
                        {MONTHS.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                </div>

                {/* Tahun */}
                <div>
                    <label htmlFor="filter-tahun" className="label text-[11px] mb-1 block text-slate-500">Tahun</label>
                    <select
                        id="filter-tahun"
                        value={selectedYear === 'all' ? 'all' : selectedYear}
                        onChange={(e) => { setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCurrentPage(1) }}
                        className="input w-full"
                        aria-label="Filter tahun"
                    >
                        <option value="all">Semua</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Brand */}
                <div>
                    <label htmlFor="filter-brand" className="label text-[11px] mb-1 block text-slate-500">Brand</label>
                    <div className="relative">
                        <select
                            id="filter-brand"
                            value={brandFilter}
                            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1) }}
                            className={`input !pl-9 !pr-9 w-full appearance-none cursor-pointer ${brandFilter !== 'all'
                                ? '!bg-slate-700 !text-white !border-slate-700 font-semibold'
                                : ''
                                }`}
                            aria-label="Filter brand"
                        >
                            <option value="all">Semua</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        <Icon.Tag className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${brandFilter !== 'all' ? 'text-white' : 'text-slate-500'}`} />
                        <svg
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${brandFilter !== 'all' ? 'text-white' : 'text-slate-400'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.7}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>

                {/* Urutkan */}
                <div>
                    <label htmlFor="filter-sort" className="label text-[11px] mb-1 block text-slate-500">Urutkan</label>
                    <select
                        id="filter-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="input w-full"
                        aria-label="Urutkan"
                    >
                        <option value="date_desc">Terbaru</option>
                        <option value="date_asc">Terlama</option>
                        <option value="customer_asc">Customer A-Z</option>
                        <option value="customer_desc">Customer Z-A</option>
                    </select>
                </div>

                {/* Reset */}
                <div>
                    {hasActiveFilters ? (
                        <button
                            onClick={clearFilters}
                            className="btn-ghost btn-sm w-full text-slate-600"
                        >
                            Reset
                        </button>
                    ) : (
                        <span className="hidden lg:block text-[11px] text-slate-300 italic select-none">Filter lancar & mudah</span>
                    )}
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="surface">
                    <EmptyState
                        icon={<DefaultEmptyIcon />}
                        title={hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada order selesai'}
                        description={hasActiveFilters
                            ? 'Coba ubah filter atau kata kunci pencarian'
                            : 'Order yang sudah dikirim dan diarsip akan muncul di sini'}
                        action={hasActiveFilters ? (
                            <button onClick={clearFilters} className="btn-secondary">
                                Reset Filter
                            </button>
                        ) : undefined}
                    />
                </div>
            ) : (
                <div className="surface overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/70">
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                                        Customer
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                                        Order
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                                        Tanggal Kirim
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                                        No. Resi
                                    </th>
                                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                                        Total Dibayar
                                    </th>
                                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedDetail(selectedDetail === order.id ? null : order.id)}
                                                className="text-left group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900 group-hover:text-red-600 transition-colors">
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
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-900">
                                                {order.nama_po || order.spk_number || '-'}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {order.total_quantity} pcs
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {formatDate(order.shipped_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-mono text-sm text-slate-700">
                                                {order.tracking_number || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 text-mono">
                                            {formatCurrency(
                                                (order.dp_desain_amount || 0) +
                                                (order.dp_produksi_amount || 0) +
                                                (order.pelunasan_amount || 0)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSelectedDetail(selectedDetail === order.id ? null : order.id)}
                                                    className="btn-ghost btn-sm text-slate-600"
                                                    aria-label="Lihat detail"
                                                >
                                                    <Icon.Eye className="w-3.5 h-3.5" />
                                                    Detail
                                                </button>
                                                <button
                                                    onClick={() => handleRestore(order.id)}
                                                    disabled={restoring === order.id}
                                                    className="btn-ghost btn-sm text-slate-600"
                                                >
                                                    {restoring === order.id ? (
                                                        <Icon.Spinner className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Icon.ArrowUturn className="w-3.5 h-3.5" />
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
                            <div className="hidden md:block border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-slate-900">Detail Order — {order.customer?.name}</h4>
                                    <button
                                        onClick={() => setSelectedDetail(null)}
                                        className="btn-ghost btn-icon btn-sm"
                                        aria-label="Tutup detail"
                                    >
                                        <Icon.X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-caption text-slate-500">SPK Number</span>
                                        <p className="font-medium text-slate-900 text-mono">{order.spk_number || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">PO Name</span>
                                        <p className="font-medium text-slate-900">{order.nama_po || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Brand</span>
                                        <p className="font-medium text-slate-900">{order.brand?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Quantity</span>
                                        <p className="font-medium text-slate-900 text-mono">{order.total_quantity} pcs</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">DP Desain</span>
                                        <p className="font-medium text-slate-900 text-mono">{formatCurrency(order.dp_desain_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">DP Produksi</span>
                                        <p className="font-medium text-slate-900 text-mono">{formatCurrency(order.dp_produksi_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Pelunasan</span>
                                        <p className="font-medium text-slate-900 text-mono">{formatCurrency(order.pelunasan_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Tanggal Kirim</span>
                                        <p className="font-medium text-slate-900">{formatDate(order.shipped_at)}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">No. Resi</span>
                                        <p className="font-medium text-slate-900 text-mono">{order.tracking_number || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Dibuat Oleh</span>
                                        <p className="font-medium text-slate-900">{order.creator?.full_name || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Deadline</span>
                                        <p className="font-medium text-slate-900">{formatDate(order.deadline)}</p>
                                    </div>
                                    <div>
                                        <span className="text-caption text-slate-500">Catatan</span>
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
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-slate-900 truncate">
                                                {order.customer?.name || '-'}
                                            </span>
                                            {order.brand && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                    {order.brand.code || order.brand.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => setSelectedDetail(selectedDetail === order.id ? null : order.id)}
                                            className="btn-ghost btn-icon btn-sm"
                                            aria-label="Lihat detail"
                                        >
                                            <Icon.Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleRestore(order.id)}
                                            disabled={restoring === order.id}
                                            className="btn-ghost btn-sm text-slate-600"
                                        >
                                            {restoring === order.id ? (
                                                <Icon.Spinner className="w-3.5 h-3.5" />
                                            ) : (
                                                <Icon.ArrowUturn className="w-3.5 h-3.5" />
                                            )}
                                            Kembalikan
                                        </button>
                                    </div>
                                </div>

                                {/* Mobile detail panel */}
                                {selectedDetail === order.id && (
                                    <div className="bg-slate-50/80 rounded-lg p-3 text-sm space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="text-caption text-slate-400">SPK</span><p className="text-slate-700 text-mono">{order.spk_number || '-'}</p></div>
                                            <div><span className="text-caption text-slate-400">PO</span><p className="text-slate-700">{order.nama_po || '-'}</p></div>
                                            <div><span className="text-caption text-slate-400">DP Desain</span><p className="text-slate-700 text-mono">{formatCurrency(order.dp_desain_amount || 0)}</p></div>
                                            <div><span className="text-caption text-slate-400">DP Produksi</span><p className="text-slate-700 text-mono">{formatCurrency(order.dp_produksi_amount || 0)}</p></div>
                                            <div><span className="text-caption text-slate-400">Pelunasan</span><p className="text-slate-700 text-mono">{formatCurrency(order.pelunasan_amount || 0)}</p></div>
                                            <div><span className="text-caption text-slate-400">Dibuat Oleh</span><p className="text-slate-700">{order.creator?.full_name || '-'}</p></div>
                                        </div>
                                        {order.production_notes && (
                                            <div><span className="text-caption text-slate-400">Catatan</span><p className="text-slate-700">{order.production_notes}</p></div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-caption text-slate-400">Order</div>
                                        <div className="text-slate-700">
                                            {order.nama_po || order.spk_number || '-'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {order.total_quantity} pcs
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-caption text-slate-400">Tanggal Kirim</div>
                                        <div className="text-slate-700">
                                            {formatDate(order.shipped_at)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-caption text-slate-400">No. Resi</div>
                                        <div className="text-mono text-slate-700">
                                            {order.tracking_number || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-caption text-slate-400">Total Dibayar</div>
                                        <div className="font-medium text-slate-900 text-mono">
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
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-sm text-slate-500">
                        Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} dari {filteredOrders.length} order
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="btn-ghost btn-sm text-slate-600 disabled:opacity-40"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 text-sm rounded-lg transition-colors ${page === currentPage
                                    ? 'bg-brand text-white font-semibold'
                                    : 'hover:bg-slate-100 text-slate-600'
                                    }`}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="btn-ghost btn-sm text-slate-600 disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
