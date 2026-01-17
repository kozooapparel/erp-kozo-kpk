'use client'

import { useState } from 'react'
import { Order, Customer, DashboardMetrics, STAGES_ORDER, STAGE_LABELS, OrderStage, GATEKEEPER_STAGES, BOTTLENECK_STAGE, BOTTLENECK_DAYS } from '@/types/database'
import KanbanColumn from './KanbanColumn'
import MetricsBar from './MetricsBar'
import AddOrderModal from '../orders/AddOrderModal'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface KanbanBoardProps {
    orders: OrderWithCustomer[]
    metrics: DashboardMetrics
    customers: Customer[]
}

export default function KanbanBoard({ orders, metrics, customers }: KanbanBoardProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Group orders by stage
    const ordersByStage = STAGES_ORDER.reduce((acc, stage) => {
        acc[stage] = orders.filter(order => order.stage === stage)
        return acc
    }, {} as Record<OrderStage, OrderWithCustomer[]>)

    // Check if order is bottleneck (in Jahit stage > 3 days)
    const isBottleneck = (order: Order) => {
        if (order.stage !== BOTTLENECK_STAGE) return false
        const stageEnteredAt = new Date(order.stage_entered_at)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff >= BOTTLENECK_DAYS
    }

    // Check if stage is a gatekeeper (needs payment verification)
    const isGatekeeperStage = (stage: OrderStage) => GATEKEEPER_STAGES.includes(stage)

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <MetricsBar metrics={metrics} />
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Order
                </button>
            </div>

            {/* Kanban Board - Horizontal Scrolling */}
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {STAGES_ORDER.map((stage) => (
                        <KanbanColumn
                            key={stage}
                            stage={stage}
                            label={STAGE_LABELS[stage]}
                            orders={ordersByStage[stage]}
                            isGatekeeper={isGatekeeperStage(stage)}
                            isBottleneckStage={stage === BOTTLENECK_STAGE}
                            checkBottleneck={isBottleneck}
                        />
                    ))}
                </div>
            </div>

            {/* Add Order Modal */}
            <AddOrderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                customers={customers}
            />
        </div>
    )
}
