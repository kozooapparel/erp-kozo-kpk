'use client'

import { Order, Customer, OrderStage } from '@/types/database'
import OrderCard from './OrderCard'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface KanbanColumnProps {
    stage: OrderStage
    label: string
    orders: OrderWithCustomer[]
    isGatekeeper: boolean
    isBottleneckStage: boolean
    checkBottleneck: (order: Order) => boolean
    onOrderClick: (order: OrderWithCustomer) => void
}

export default function KanbanColumn({
    stage,
    label,
    orders,
    isGatekeeper,
    isBottleneckStage,
    checkBottleneck,
    onOrderClick,
}: KanbanColumnProps) {
    return (
        <div className="w-72 flex-shrink-0">
            {/* Column Header */}
            <div
                className={`mb-3 p-3 rounded-xl flex items-center justify-between ${isGatekeeper
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                        : isBottleneckStage
                            ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30'
                            : 'bg-white/50 border border-slate-200/50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    {isGatekeeper && (
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    )}
                    {isBottleneckStage && (
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-300">
                    {orders.length}
                </span>
            </div>

            {/* Column Content */}
            <div className="space-y-3 min-h-[200px] p-2 rounded-xl bg-white/30 border border-slate-200/30">
                {orders.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
                        No orders
                    </div>
                ) : (
                    orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            isBottleneck={checkBottleneck(order)}
                            onClick={() => onOrderClick(order)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

