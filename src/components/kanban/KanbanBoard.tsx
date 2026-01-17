'use client'

import { Order, Customer, DashboardMetrics, STAGES_ORDER, STAGE_LABELS, OrderStage, GATEKEEPER_STAGES, BOTTLENECK_STAGE, BOTTLENECK_DAYS } from '@/types/database'
import KanbanColumn from './KanbanColumn'
import MetricsBar from './MetricsBar'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface KanbanBoardProps {
    orders: OrderWithCustomer[]
    metrics: DashboardMetrics
}

export default function KanbanBoard({ orders, metrics }: KanbanBoardProps) {
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
            {/* Metrics Bar */}
            <MetricsBar metrics={metrics} />

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
        </div>
    )
}
