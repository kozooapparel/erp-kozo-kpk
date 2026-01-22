'use client'

import { useState } from 'react'
import { Order, Customer, STAGE_LABELS, OrderStage } from '@/types/database'
import SPKDownloadButton from './SPKDownloadButton'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface SPKListProps {
    orders: OrderWithCustomer[]
}

export default function SPKList({ orders }: SPKListProps) {
    const [filter, setFilter] = useState<string>('all')
    const [search, setSearch] = useState('')

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

    return (
        <div className="space-y-4">
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
