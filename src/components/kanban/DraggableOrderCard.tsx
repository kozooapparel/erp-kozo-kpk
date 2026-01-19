'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Order, Customer, OrderStage } from '@/types/database'
import Image from 'next/image'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface DraggableOrderCardProps {
    order: OrderWithCustomer
    isBottleneck: boolean
    onClick: () => void
}

export default function DraggableOrderCard({ order, isBottleneck, onClick }: DraggableOrderCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    }

    const formatDate = (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        })
    }

    const getDaysInStage = () => {
        const stageEnteredAt = new Date(order.stage_entered_at)
        const now = new Date()
        return Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
    }

    const getPaymentStatus = () => {
        if (order.pelunasan_verified) return { label: 'Lunas', color: 'bg-emerald-500' }
        if (order.dp_produksi_verified) return { label: 'DP 50%', color: 'bg-amber-500' }
        if (order.dp_desain_verified) return { label: 'DP Desain', color: 'bg-blue-500' }
        return { label: 'Belum Bayar', color: 'bg-red-500' }
    }

    // Determine if order is ready to move to next stage
    const getStageReadiness = (): { isReady: boolean; reason?: string } => {
        const stage = order.stage as OrderStage

        switch (stage) {
            case 'customer_dp_desain':
                return {
                    isReady: order.dp_desain_verified,
                    reason: order.dp_desain_verified ? undefined : 'Menunggu DP Desain'
                }
            case 'proses_desain':
                return {
                    isReady: order.mockup_url !== null,
                    reason: order.mockup_url ? undefined : 'Belum upload mockup ACC'
                }
            case 'dp_produksi':
                return {
                    isReady: order.dp_produksi_verified,
                    reason: order.dp_produksi_verified ? undefined : 'Menunggu DP Produksi'
                }
            case 'pelunasan':
                return {
                    isReady: order.pelunasan_verified,
                    reason: order.pelunasan_verified ? undefined : 'Menunggu Pelunasan'
                }
            case 'pengiriman':
                return {
                    isReady: order.tracking_number !== null && order.shipped_at !== null,
                    reason: (order.tracking_number && order.shipped_at) ? undefined : 'Belum dikirim'
                }
            // Production stages - always need manual verification
            case 'antrean_produksi':
            case 'print_press':
            case 'cutting_bahan':
            case 'jahit':
            case 'quality_control':
            case 'packing':
            default:
                return {
                    isReady: false,
                    reason: 'Perlu verifikasi admin'
                }
        }
    }

    const paymentStatus = getPaymentStatus()
    const daysInStage = getDaysInStage()
    const stageReadiness = getStageReadiness()

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                if (!isDragging) {
                    onClick()
                }
            }}
            className={`group transition-all ${isDragging ? 'z-50' : ''}`}
        >
            {/* Outer Container - Pastel Background */}
            <div className={`pt-3 px-2 pb-2 rounded-3xl transition-all ${stageReadiness.isReady
                ? 'bg-emerald-50 dark:bg-emerald-950/30'
                : 'bg-red-50 dark:bg-red-950/30'
                } ${isDragging ? 'ring-2 ring-offset-2 ring-emerald-500' : ''} ${isBottleneck ? 'ring-2 ring-red-400 animate-pulse' : ''
                }`}>

                {/* Header Status - In outer container padding area */}
                <div className={`flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider ${stageReadiness.isReady
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stageReadiness.isReady ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                    {stageReadiness.isReady ? 'SIAP PINDAH' : 'PERLU ACTION'}

                    {/* Bottleneck Days Badge */}
                    {isBottleneck && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500 text-white">
                            {daysInStage}d
                        </span>
                    )}
                </div>

                {/* Inner Card - White Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">

                    {/* Card Content */}
                    <div className="p-4">
                        {/* Mockup Thumbnail */}
                        <div className="relative mb-3">
                            {order.mockup_url ? (
                                <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <Image
                                        src={order.mockup_url}
                                        alt="Mockup"
                                        fill
                                        className="object-cover pointer-events-none"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-28 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
                                    <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Customer Name */}
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate mb-2">
                            {order.customer?.name || 'Unknown'}
                        </h4>

                        {/* Order Details Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
                                <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    {order.total_quantity} pcs
                                </span>
                                {order.deadline && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {formatDate(order.deadline)}
                                    </span>
                                )}
                            </div>

                            {/* Payment Badge - Bottom Right */}
                            <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full text-white ${paymentStatus.color}`}>
                                {paymentStatus.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
