'use client'

import { Order, Customer } from '@/types/database'
import Image from 'next/image'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface OrderCardProps {
    order: OrderWithCustomer
    isBottleneck: boolean
}

export default function OrderCard({ order, isBottleneck }: OrderCardProps) {
    const formatDate = (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        })
    }

    // Calculate days in current stage
    const getDaysInStage = () => {
        const stageEnteredAt = new Date(order.stage_entered_at)
        const now = new Date()
        return Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Payment status
    const getPaymentStatus = () => {
        if (order.pelunasan_verified) return { label: 'Lunas', color: 'bg-emerald-500' }
        if (order.dp_produksi_verified) return { label: 'DP 50%', color: 'bg-amber-500' }
        if (order.dp_desain_verified) return { label: 'DP Desain', color: 'bg-blue-500' }
        return { label: 'Belum Bayar', color: 'bg-red-500' }
    }

    const paymentStatus = getPaymentStatus()
    const daysInStage = getDaysInStage()

    return (
        <div
            className={`group relative p-3 rounded-xl bg-slate-800/80 border transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer ${isBottleneck
                    ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse'
                    : 'border-slate-700/50'
                }`}
        >
            {/* Bottleneck Warning */}
            {isBottleneck && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                    {daysInStage}d
                </div>
            )}

            {/* Mockup Thumbnail */}
            {order.mockup_url ? (
                <div className="relative w-full h-24 mb-3 rounded-lg overflow-hidden bg-slate-700">
                    <Image
                        src={order.mockup_url}
                        alt="Mockup"
                        fill
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="w-full h-24 mb-3 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            {/* Customer Name */}
            <h4 className="font-semibold text-white text-sm truncate">{order.customer?.name || 'Unknown'}</h4>

            {/* Order Details */}
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {order.total_quantity} pcs
                    </span>
                    {order.deadline && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(order.deadline)}
                        </span>
                    )}
                </div>

                {/* Payment Badge */}
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full text-white ${paymentStatus.color}`}>
                    {paymentStatus.label}
                </span>
            </div>
        </div>
    )
}
