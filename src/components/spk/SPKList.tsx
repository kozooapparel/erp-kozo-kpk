'use client'

import { useState } from 'react'
import { Order, Customer, STAGE_LABELS, OrderStage } from '@/types/database'
import SPKDownloadButton from './SPKDownloadButton'
import { EmptyState, DefaultEmptyIcon, StatCard } from '@/components/ui/ds'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface BrandItem {
    id: string
    code: string
    name: string
}

interface SPKListProps {
    orders: OrderWithCustomer[]
    brands: BrandItem[]
}

// Icons
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
    Document: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
}

export default function SPKList({ orders, brands }: SPKListProps) {
    const [filter, setFilter] = useState<string>('all')
    const [search, setSearch] = useState('')
    const [brandFilter, setBrandFilter] = useState<string>('all')

    // Production stages for filtering (include dp_produksi since SPK can be filled there)
    const productionStages: OrderStage[] = [
        'dp_produksi',
        'antrean_produksi',
        'print_press',
        'cutting_jahit',
        'packing',
        'pelunasan',
        'pengiriman'
    ]

    const filteredOrders = orders.filter(order => {
        // Stage filter
        if (filter !== 'all' && order.stage !== filter) return false

        // Brand filter
        if (brandFilter !== 'all' && order.brand_id !== brandFilter) return false

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase()
            return (
                order.spk_number?.toLowerCase().includes(searchLower) ||
                order.nama_po?.toLowerCase().includes(searchLower) ||
                order.customer?.name?.toLowerCase().includes(searchLower)
            )
        }
        return true
    })

    const formatDate = (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    // Summary stats
    const totalQty = filteredOrders.reduce((sum, o) => sum + (o.total_quantity || 0), 0)
    const draftCount = filteredOrders.filter(o => !o.spk_number).length

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                    label="Total SPK"
                    value={filteredOrders.length}
                    tone="brand"
                />
                <StatCard
                    label="Total Quantity"
                    value={`${totalQty.toLocaleString('id-ID')} pcs`}
                    tone="info"
                />
                <StatCard
                    label="Draft SPK"
                    value={draftCount}
                    tone="warning"
                />
            </div>

            {/* Filters */}
            <div className="surface p-3 flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1">
                    <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari SPK, PO, atau customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-9 w-full"
                        aria-label="Cari SPK"
                    />
                </div>

                {/* Stage Filter */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input w-full sm:w-auto min-w-[160px]"
                    aria-label="Filter stage produksi"
                >
                    <option value="all">Semua Stage</option>
                    {productionStages.map(stage => (
                        <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
                    ))}
                </select>

                {/* Brand Filter Dropdown */}
                <div className="relative flex items-center">
                    <Icon.Tag className={`absolute left-2.5 w-4 h-4 pointer-events-none transition-colors ${brandFilter !== 'all' ? 'text-white' : 'text-slate-500'}`} />
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className={`input pl-8 pr-8 w-full sm:w-auto min-w-[160px] appearance-none cursor-pointer ${brandFilter !== 'all'
                            ? '!bg-slate-700 !text-white !border-slate-700 font-semibold'
                            : ''
                            }`}
                        aria-label="Filter brand"
                    >
                        <option value="all">Semua Brand</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    <svg
                        className={`absolute right-2 w-4 h-4 pointer-events-none transition-colors ${brandFilter !== 'all' ? 'text-white' : 'text-slate-400'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.7}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </div>

            {/* SPK Cards */}
            <div className="grid gap-3">
                {filteredOrders.length === 0 ? (
                    <div className="surface">
                        <EmptyState
                            icon={<DefaultEmptyIcon />}
                            title="Tidak ada SPK ditemukan"
                            description="Coba ubah filter atau kata kunci pencarian"
                        />
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className={`surface surface-hover p-4 ${!order.spk_number ? '!border-amber-200/70' : ''}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* SPK Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {order.spk_number ? (
                                            <span className="text-mono font-bold text-red-600">{order.spk_number}</span>
                                        ) : (
                                            <span className="badge badge-warning">
                                                Draft SPK
                                            </span>
                                        )}
                                        {order.nama_po && (
                                            <span className="text-sm text-slate-600">• PO: {order.nama_po}</span>
                                        )}
                                        <span className="badge badge-info">
                                            {STAGE_LABELS[order.stage]}
                                        </span>
                                        {(order as any).brand?.code && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                {(order as any).brand.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-900 font-medium truncate">{order.customer?.name}</p>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                                        <span className="text-mono">{order.total_quantity} pcs</span>
                                        <span className="text-slate-300">•</span>
                                        <span>Deadline: {formatDate(order.deadline)}</span>
                                    </div>
                                    {/* Size Breakdown Preview - from spk_sections or size_breakdown */}
                                    {order.spk_sections && order.spk_sections.length > 0 ? (
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {order.spk_sections.map((section: { id: string; title: string; size_breakdown?: Record<string, number> }) => (
                                                <span key={section.id} className="px-2 py-0.5 rounded-md bg-blue-50 text-xs text-blue-600 border border-blue-100/80 text-mono">
                                                    {section.title}
                                                </span>
                                            ))}
                                        </div>
                                    ) : order.size_breakdown && Object.keys(order.size_breakdown).length > 0 && (
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {Object.entries(order.size_breakdown).map(([size, qty]) => (
                                                <span key={size} className="px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-600 text-mono">
                                                    {size}: {String(qty)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <SPKDownloadButton order={order} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Count */}
            <p className="text-sm text-slate-500 text-center">
                Menampilkan {filteredOrders.length} dari {orders.length} SPK
            </p>
        </div>
    )
}
