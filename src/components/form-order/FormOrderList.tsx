'use client'

import { useState } from 'react'
import { ProductionSpecs, STAGE_LABELS, OrderStage, OrderWithCustomer } from '@/types/database'
import FormOrderDownloadButton from './FormOrderDownloadButton'
import { EmptyState, DefaultEmptyIcon, StatCard } from '@/components/ui/ds'
import { getDeadlineProduksi, formatTanggal } from '@/lib/form-order'

interface BrandItem {
    id: string
    code: string
    name: string
}

interface FormOrderListProps {
    orders: OrderWithCustomer[]
    brands: BrandItem[]
}

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
}

export default function FormOrderList({ orders, brands }: FormOrderListProps) {
    const [filter, setFilter] = useState<string>('all')
    const [search, setSearch] = useState('')
    const [brandFilter, setBrandFilter] = useState<string>('all')

    const productionStages: OrderStage[] = [
        'dp_produksi',
        'antrean_produksi',
        'print_press',
        'cutting_jahit',
        'packing',
        'pelunasan',
        'pengiriman',
    ]

    const filteredOrders = orders.filter(order => {
        if (filter !== 'all' && order.stage !== filter) return false
        if (brandFilter !== 'all' && order.brand_id !== brandFilter) return false

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

    const totalQty = filteredOrders.reduce((sum, o) => {
        const specs = o.production_specs as ProductionSpecs | null
        return sum + (specs?.jumlah_produksi || o.total_quantity || 0)
    }, 0)
    const draftCount = filteredOrders.filter(o => !o.spk_number).length

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <StatCard label="Total Form Order" value={filteredOrders.length} tone="brand" />
                <StatCard label="Total Quantity" value={`${totalQty.toLocaleString('id-ID')} pcs`} tone="info" />
                <StatCard label="Draft" value={draftCount} tone="warning" />
            </div>

            {/* Filters */}
            <div className="surface p-3 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nomor, PO, atau customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-9 w-full"
                        aria-label="Cari form order"
                    />
                </div>

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

            {/* Cards */}
            <div className="grid gap-3">
                {filteredOrders.length === 0 ? (
                    <div className="surface">
                        <EmptyState
                            icon={<DefaultEmptyIcon />}
                            title="Tidak ada form order ditemukan"
                            description="Coba ubah filter atau kata kunci pencarian"
                        />
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const specs = order.production_specs as ProductionSpecs | null
                        const qty = specs?.jumlah_produksi || order.total_quantity || 0

                        return (
                            <div
                                key={order.id}
                                className={`surface surface-hover p-4 ${!order.spk_number ? '!border-amber-200/70' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {order.spk_number ? (
                                                <span className="text-mono font-bold text-red-600">{order.spk_number}</span>
                                            ) : (
                                                <span className="badge badge-warning">Draft</span>
                                            )}
                                            {order.nama_po && (
                                                <span className="text-sm text-slate-600">• PO: {order.nama_po}</span>
                                            )}
                                            <span className="badge badge-info">{STAGE_LABELS[order.stage]}</span>
                                            {(order as { brand?: { code?: string } }).brand?.code && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                                    {(order as { brand?: { code?: string } }).brand?.code}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-900 font-medium truncate">{order.customer?.name}</p>
                                        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
                                            <span className="text-mono">{qty} pcs</span>
                                            <span className="text-slate-300">•</span>
                                            <span>Order: {formatTanggal(order.created_at)}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>Deadline: {formatTanggal(getDeadlineProduksi(order.created_at))}</span>
                                        </div>
                                        {specs && (specs.jenis_produk || specs.jenis_bahan || specs.model_kerah) && (
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                {[specs.jenis_produk, specs.jenis_bahan, specs.model_kerah, specs.model_lengan]
                                                    .filter(Boolean)
                                                    .map((val, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-xs text-blue-600 border border-blue-100/80">
                                                            {val}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <FormOrderDownloadButton order={order} />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <p className="text-sm text-slate-500 text-center">
                Menampilkan {filteredOrders.length} dari {orders.length} form order
            </p>
        </div>
    )
}
