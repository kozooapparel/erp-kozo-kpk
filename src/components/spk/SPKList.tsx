'use client'

import { useState } from 'react'
import { Order, Customer, STAGE_LABELS, OrderStage } from '@/types/database'
import SPKDownloadButton from './SPKDownloadButton'

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total SPK</p>
                    <p className="text-2xl font-bold text-slate-900">{filteredOrders.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Quantity</p>
                    <p className="text-2xl font-bold text-blue-600">{totalQty.toLocaleString('id-ID')} pcs</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Draft SPK</p>
                    <p className="text-2xl font-bold text-amber-500">{draftCount}</p>
                </div>
            </div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari SPK, PO, atau customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Stage Filter */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="all">Semua Stage</option>
                    {productionStages.map(stage => (
                        <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
                    ))}
                </select>

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
                        className={`pl-8 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer ${brandFilter !== 'all'
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

            {/* SPK Cards */}
            <div className="grid gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Tidak ada SPK ditemukan</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${order.spk_number ? 'border-slate-200' : 'border-amber-300 bg-amber-50/30'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* SPK Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {order.spk_number ? (
                                            <span className="font-mono font-bold text-blue-600">{order.spk_number}</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                Draft SPK
                                            </span>
                                        )}
                                        {order.nama_po && (
                                            <span className="text-sm text-slate-600">• PO: {order.nama_po}</span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${order.stage === 'pengiriman' ? 'bg-purple-100 text-purple-700' :
                                            order.stage === 'dp_produksi' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {STAGE_LABELS[order.stage]}
                                        </span>
                                        {(order as any).brand?.code && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                {(order as any).brand.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-900 font-medium">{order.customer?.name}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                        <span>{order.total_quantity} pcs</span>
                                        <span>•</span>
                                        <span>Deadline: {formatDate(order.deadline)}</span>
                                    </div>
                                    {/* Size Breakdown Preview - from spk_sections or size_breakdown */}
                                    {order.spk_sections && order.spk_sections.length > 0 ? (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {order.spk_sections.map((section: { id: string; title: string; size_breakdown?: Record<string, number> }) => (
                                                <span key={section.id} className="px-2 py-0.5 rounded bg-blue-50 text-xs text-blue-600 border border-blue-100">
                                                    {section.title}
                                                </span>
                                            ))}
                                        </div>
                                    ) : order.size_breakdown && Object.keys(order.size_breakdown).length > 0 && (
                                        <div className="flex gap-1 mt-2">
                                            {Object.entries(order.size_breakdown).map(([size, qty]) => (
                                                <span key={size} className="px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600">
                                                    {size}: {qty}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
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
