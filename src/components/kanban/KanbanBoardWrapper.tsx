'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Order, Customer, DashboardMetrics } from '@/types/database'
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

// Extended order type with creator profile
interface OrderWithCustomerAndCreator extends Order {
    customer: Customer
    creator: { id: string; full_name: string } | null
}

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
    orders: OrderWithCustomerAndCreator[]
    metrics: DashboardMetrics
    customers: Customer[]
    admins: AdminProfile[]
    brands: BrandItem[]
}

export default function KanbanBoardWrapper({ orders, metrics, customers, admins, brands }: KanbanBoardWrapperProps) {
    const router = useRouter()
    const supabase = createClient()

    // Supabase Realtime subscription for live updates
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    console.log('Realtime update:', payload.eventType)
                    // Refresh the page data when any order changes
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router])

    return (
        <KanbanBoard
            orders={orders}
            metrics={metrics}
            customers={customers}
            admins={admins}
            brands={brands}
        />
    )
}
