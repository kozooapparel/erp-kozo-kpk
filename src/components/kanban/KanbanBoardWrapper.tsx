'use client'

import dynamic from 'next/dynamic'
import { Order, Customer, DashboardMetrics } from '@/types/database'

// Dynamic import to prevent hydration mismatch from dnd-kit
const KanbanBoard = dynamic(() => import('./KanbanBoard'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    ),
})

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface KanbanBoardWrapperProps {
    orders: OrderWithCustomer[]
    metrics: DashboardMetrics
    customers: Customer[]
}

export default function KanbanBoardWrapper({ orders, metrics, customers }: KanbanBoardWrapperProps) {
    return (
        <KanbanBoard
            orders={orders}
            metrics={metrics}
            customers={customers}
        />
    )
}
