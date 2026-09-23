'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Customer, DashboardMetrics, STAGE_BOTTLENECK_DAYS, OrderWithCustomer } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

// Dynamic import to prevent hydration mismatch from dnd-kit
const KanbanBoard = dynamic(() => import('./KanbanBoard'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    ),
})

interface AdminProfile {
    id: string
    full_name: string
}

interface BrandItem {
    id: string
    code: string
    name: string
}

interface KanbanBoardWrapperProps {
    orders: OrderWithCustomer[]
    metrics: DashboardMetrics
    customers: Customer[]
    admins: AdminProfile[]
    brands: BrandItem[]
}

export default function KanbanBoardWrapper({ orders, metrics, customers, admins, brands }: KanbanBoardWrapperProps) {
    const supabase = useMemo(() => createClient(), [])
    const [localOrders, setLocalOrders] = useState<OrderWithCustomer[]>(orders)

    useEffect(() => {
        setLocalOrders(orders)
    }, [orders])

    const upsertOrder = useCallback((nextOrder: OrderWithCustomer) => {
        setLocalOrders((currentOrders) => {
            const existingIndex = currentOrders.findIndex((order) => order.id === nextOrder.id)

            if (nextOrder.is_archived) {
                return currentOrders.filter((order) => order.id !== nextOrder.id)
            }

            if (existingIndex === -1) {
                return [nextOrder, ...currentOrders]
            }

            const updatedOrders = [...currentOrders]
            updatedOrders[existingIndex] = nextOrder
            return updatedOrders
        })
    }, [])

    const patchOrder = useCallback((orderId: string, updates: Partial<OrderWithCustomer>) => {
        setLocalOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === orderId
                    ? { ...order, ...updates }
                    : order
            )
        )
    }, [])

    const removeOrder = useCallback((orderId: string) => {
        setLocalOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId))
    }, [])

    const fetchOrderById = useCallback(async (orderId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                invoices(id),
                customer:customers(*),
                creator:profiles!created_by(id, full_name),
                brand:brands(*)
            `)
            .eq('id', orderId)
            .single()

        if (error) {
            console.error('Failed to fetch latest order:', error)
            return null
        }

        return data as OrderWithCustomer
    }, [supabase])

    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000)
        return () => clearInterval(id)
    }, [])

    const localMetrics = useMemo(() => {
        const bottleneckCount = localOrders.filter((order) => {
            const threshold = STAGE_BOTTLENECK_DAYS[order.stage]
            const stageEnteredAt = new Date(order.stage_entered_at)
            const daysInStage = Math.floor((now - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
            return daysInStage >= threshold
        }).length

        return {
            ...metrics,
            total_active_orders: localOrders.length,
            bottleneck_count: bottleneckCount,
        }
    }, [localOrders, metrics, now])

    // Supabase Realtime subscription for live updates
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                async (payload) => {
                    if (payload.eventType === 'DELETE') {
                        removeOrder(String(payload.old.id))
                        return
                    }

                    const latestOrder = await fetchOrderById(String(payload.new.id))
                    if (!latestOrder) return

                    if (latestOrder.is_archived) {
                        removeOrder(latestOrder.id)
                        return
                    }

                    upsertOrder(latestOrder)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchOrderById, removeOrder, supabase, upsertOrder])

    return (
        <KanbanBoard
            orders={localOrders}
            metrics={localMetrics}
            customers={customers}
            admins={admins}
            brands={brands}
            onOrderCreated={upsertOrder}
            onOrderUpdated={patchOrder}
            onOrderRemoved={removeOrder}
        />
    )
}
