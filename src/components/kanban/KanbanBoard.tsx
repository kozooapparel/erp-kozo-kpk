'use client'

import { useState, useRef, useEffect } from 'react'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Order, Customer, DashboardMetrics, STAGES_ORDER, STAGE_LABELS, OrderStage, GATEKEEPER_STAGES, STAGE_BOTTLENECK_DAYS } from '@/types/database'
import DroppableColumn from './DroppableColumn'
import MetricsBar from './MetricsBar'
import SearchBar from '../ui/SearchBar'
import OrderStatusFilter, { OrderFilter } from '../ui/OrderStatusFilter'
import AddOrderModal from '../orders/AddOrderModal'
import OrderDetailModal from '../orders/OrderDetailModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface OrderWithCustomer extends Order {
    customer: Customer
    creator: { id: string; full_name: string } | null
}

interface AdminProfile {
    id: string
    full_name: string
}

interface KanbanBoardProps {
    orders: OrderWithCustomer[]
    metrics: DashboardMetrics
    customers: Customer[]
    admins: AdminProfile[]
}

export default function KanbanBoard({ orders, metrics, customers, admins }: KanbanBoardProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)
    const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
    const [adminFilter, setAdminFilter] = useState<string>('all') // Admin filter state

    // Mobile responsive states
    const [isMobile, setIsMobile] = useState(false)
    const [currentStageIndex, setCurrentStageIndex] = useState(0)

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const router = useRouter()
    const supabase = createClient()

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Scroll navigation - scroll by one column width (288px + gap)
    const scrollKanban = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 304 // column width (288px) + gap (16px)
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    // Configure sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Check if order is ready to move to next stage
    const isOrderReady = (order: Order): boolean => {
        switch (order.stage) {
            case 'customer_dp_desain':
                return order.dp_desain_verified
            case 'proses_desain':
                return order.mockup_url !== null
            case 'proses_layout':
                return order.layout_completed
            case 'dp_produksi':
                return order.dp_produksi_verified
            case 'antrean_produksi':
                return order.production_ready
            case 'print_press':
                return order.print_completed
            case 'cutting_jahit':
                return order.sewing_completed
            case 'packing':
                return order.packing_completed
            case 'pelunasan':
                return order.pelunasan_verified
            case 'pengiriman':
                return order.tracking_number !== null && order.shipped_at !== null
            default:
                return false
        }
    }

    // Check if order is bottleneck
    const isOrderBottleneck = (order: Order): boolean => {
        const stageEnteredAt = new Date(order.stage_entered_at)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
        const threshold = STAGE_BOTTLENECK_DAYS[order.stage]
        return daysDiff >= threshold
    }

    // Check if order deadline is within 3 days
    const isDeadlineSoon = (order: Order): boolean => {
        if (!order.deadline) return false
        const deadline = new Date(order.deadline)
        const now = new Date()
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilDeadline <= 3 && daysUntilDeadline >= 0
    }

    // Filter orders based on search query, order status, and admin
    const filteredOrders = orders.filter(order => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchesSearch = (
                order.customer?.name.toLowerCase().includes(query) ||
                order.order_description?.toLowerCase().includes(query) ||
                order.customer?.phone.includes(query)
            )
            if (!matchesSearch) return false
        }

        // Order status filter
        if (orderFilter !== 'all') {
            switch (orderFilter) {
                case 'needs_action':
                    if (isOrderReady(order)) return false
                    break
                case 'ready_move':
                    if (!isOrderReady(order)) return false
                    break
                case 'bottleneck':
                    if (!isOrderBottleneck(order)) return false
                    break
                case 'deadline_soon':
                    if (!isDeadlineSoon(order)) return false
                    break
            }
        }

        // Admin filter
        if (adminFilter !== 'all') {
            if (order.created_by !== adminFilter) return false
        }

        return true
    })

    // Group orders by stage
    const ordersByStage = STAGES_ORDER.reduce((acc, stage) => {
        acc[stage] = filteredOrders.filter(order => order.stage === stage)
        return acc
    }, {} as Record<OrderStage, OrderWithCustomer[]>)

    // Check if order is bottleneck (exceeded stage-specific threshold)
    // Proses Desain: 1 day, Other stages: 2 days
    const isBottleneck = (order: Order) => {
        const stageEnteredAt = new Date(order.stage_entered_at)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
        const threshold = STAGE_BOTTLENECK_DAYS[order.stage]
        return daysDiff >= threshold
    }

    // Check if stage has any bottleneck orders
    const hasBottleneckOrders = (stage: OrderStage) => {
        return ordersByStage[stage]?.some(order => isBottleneck(order)) || false
    }

    // Check if stage is a gatekeeper
    const isGatekeeperStage = (stage: OrderStage) => GATEKEEPER_STAGES.includes(stage)

    // Check if order can move to target stage (gatekeeper logic - must complete current stage first)
    const canMoveToStage = (order: OrderWithCustomer, targetStage: OrderStage): { allowed: boolean; reason?: string } => {
        const currentIndex = STAGES_ORDER.indexOf(order.stage)
        const targetIndex = STAGES_ORDER.indexOf(targetStage)

        // Only check when moving forward
        if (targetIndex > currentIndex) {
            // Check if current stage is completed before allowing move
            switch (order.stage) {
                case 'customer_dp_desain':
                    if (!order.dp_desain_verified) {
                        return { allowed: false, reason: 'Selesaikan DP Desain terlebih dahulu' }
                    }
                    break
                case 'proses_desain':
                    if (!order.mockup_url) {
                        return { allowed: false, reason: 'Upload desain yang sudah di-ACC terlebih dahulu' }
                    }
                    break
                case 'proses_layout':
                    if (!order.layout_completed) {
                        return { allowed: false, reason: 'Selesaikan Layout terlebih dahulu' }
                    }
                    break
                case 'dp_produksi':
                    if (!order.dp_produksi_verified) {
                        return { allowed: false, reason: 'Verifikasi DP Produksi terlebih dahulu' }
                    }
                    break
                case 'antrean_produksi':
                    if (!order.production_ready) {
                        return { allowed: false, reason: 'Selesaikan Antrean Produksi terlebih dahulu' }
                    }
                    break
                case 'print_press':
                    if (!order.print_completed) {
                        return { allowed: false, reason: 'Selesaikan Print & Press terlebih dahulu' }
                    }
                    break
                case 'cutting_jahit':
                    if (!order.sewing_completed) {
                        return { allowed: false, reason: 'Selesaikan Cutting & Jahit terlebih dahulu' }
                    }
                    break
                case 'packing':
                    if (!order.packing_completed) {
                        return { allowed: false, reason: 'Selesaikan Packing terlebih dahulu' }
                    }
                    break
                case 'pelunasan':
                    if (!order.pelunasan_verified) {
                        return { allowed: false, reason: 'Verifikasi Pelunasan terlebih dahulu' }
                    }
                    break
                case 'pengiriman':
                    if (!order.tracking_number || !order.shipped_at) {
                        return { allowed: false, reason: 'Isi nomor resi dan tanggal kirim terlebih dahulu' }
                    }
                    break
            }
        }
        return { allowed: true }
    }

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id))
    }

    // Handle drag end - update order stage
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const orderId = String(active.id)
        const targetStage = over.id as OrderStage

        const order = orders.find(o => o.id === orderId)
        if (!order) return

        if (order.stage === targetStage) return

        const moveCheck = canMoveToStage(order, targetStage)
        if (!moveCheck.allowed) {
            toast.warning(moveCheck.reason)
            return
        }

        try {
            const { error, data } = await supabase
                .from('orders')
                .update({
                    stage: targetStage,
                    stage_entered_at: new Date().toISOString()
                })
                .eq('id', orderId)
                .select()

            if (error) {
                console.error('Supabase error:', error.message, error.code)
                toast.error(`Gagal pindah stage: ${error.message}`)
                return
            }

            console.log('Stage updated:', data)
            router.refresh()
        } catch (err) {
            console.error('Failed to update stage:', err)
            toast.error('Terjadi kesalahan saat update stage')
        }
    }

    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)]">
            {/* Header Section */}
            <div className="space-y-3 mb-4">
                {/* Metrics Row */}
                <MetricsBar metrics={metrics} />

                {/* Search and Add Button Row */}
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <SearchBar onSearch={setSearchQuery} />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-3 md:px-6 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/25 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Tambah Order</span>
                    </button>
                </div>

                {/* Filter Row - Horizontal scroll on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Filter:</span>
                    <OrderStatusFilter onFilterChange={setOrderFilter} />

                    {/* Admin Filter Dropdown with Icon */}
                    <div className="relative flex items-center">
                        <svg
                            className={`absolute left-2.5 w-4 h-4 pointer-events-none transition-colors ${adminFilter !== 'all' ? 'text-white' : 'text-slate-500'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <select
                            value={adminFilter}
                            onChange={(e) => setAdminFilter(e.target.value)}
                            className={`pl-8 pr-8 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all appearance-none cursor-pointer ${adminFilter !== 'all'
                                ? 'bg-slate-700 text-white border-slate-700 font-semibold'
                                : 'bg-white text-slate-700 border-slate-200'
                                }`}
                        >
                            <option value="all" className="bg-white text-slate-700">Semua Admin</option>
                            {admins.map(admin => (
                                <option key={admin.id} value={admin.id} className="bg-white text-slate-700">
                                    {admin.full_name}
                                </option>
                            ))}
                        </select>
                        <svg
                            className={`absolute right-2 w-4 h-4 pointer-events-none transition-colors ${adminFilter !== 'all' ? 'text-white' : 'text-slate-400'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Kanban Board - Full height, scrollbar at bottom */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 relative">
                    {/* Mobile Stage Header with Navigation */}
                    {isMobile && (
                        <div className="mb-3">
                            {/* Stage Navigation */}
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    onClick={() => setCurrentStageIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentStageIndex === 0}
                                    className={`p-2 rounded-full ${currentStageIndex === 0
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="text-center flex-1">
                                    <h3 className="font-semibold text-slate-900">{STAGE_LABELS[STAGES_ORDER[currentStageIndex]]}</h3>
                                    <p className="text-xs text-slate-500">{currentStageIndex + 1} / {STAGES_ORDER.length}</p>
                                </div>
                                <button
                                    onClick={() => setCurrentStageIndex(prev => Math.min(STAGES_ORDER.length - 1, prev + 1))}
                                    disabled={currentStageIndex === STAGES_ORDER.length - 1}
                                    className={`p-2 rounded-full ${currentStageIndex === STAGES_ORDER.length - 1
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            {/* Stage Indicator Dots */}
                            <div className="flex justify-center gap-1.5">
                                {STAGES_ORDER.map((stage, index) => (
                                    <button
                                        key={stage}
                                        onClick={() => setCurrentStageIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentStageIndex
                                            ? 'bg-emerald-500 w-4'
                                            : 'bg-slate-300 hover:bg-slate-400'
                                            }`}
                                        title={STAGE_LABELS[stage]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Desktop: Sticky Side Navigation Buttons */}
                    {!isMobile && (
                        <>
                            {/* Left Navigation - Sticky wrapper */}
                            <div className="absolute left-4 top-0 bottom-0 z-20 pointer-events-none">
                                <div className="sticky top-1/2 -translate-y-1/2 pointer-events-auto">
                                    <button
                                        onClick={() => scrollKanban('left')}
                                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all hover:scale-110 shadow-lg"
                                        title="Scroll Left"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Right Navigation - Sticky wrapper */}
                            <div className="absolute right-4 top-0 bottom-0 z-20 pointer-events-none">
                                <div className="sticky top-1/2 -translate-y-1/2 pointer-events-auto">
                                    <button
                                        onClick={() => scrollKanban('right')}
                                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all hover:scale-110 shadow-lg"
                                        title="Scroll Right"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Columns Container */}
                    {isMobile ? (
                        // Mobile: Single Column
                        <div className="h-full pb-4">
                            <DroppableColumn
                                key={STAGES_ORDER[currentStageIndex]}
                                stage={STAGES_ORDER[currentStageIndex]}
                                label={STAGE_LABELS[STAGES_ORDER[currentStageIndex]]}
                                orders={ordersByStage[STAGES_ORDER[currentStageIndex]]}
                                isGatekeeper={isGatekeeperStage(STAGES_ORDER[currentStageIndex])}
                                isBottleneckStage={hasBottleneckOrders(STAGES_ORDER[currentStageIndex])}
                                checkBottleneck={isBottleneck}
                                onOrderClick={(order) => setSelectedOrder(order)}
                                fullWidth
                            />
                        </div>
                    ) : (
                        // Desktop: Scrollable Container with ALWAYS visible bottom scrollbar
                        <div
                            ref={scrollContainerRef}
                            className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin"
                        >
                            <div className="flex gap-3 min-w-max h-full pb-2 px-2">
                                {STAGES_ORDER.map((stage) => (
                                    <DroppableColumn
                                        key={stage}
                                        stage={stage}
                                        label={STAGE_LABELS[stage]}
                                        orders={ordersByStage[stage]}
                                        isGatekeeper={isGatekeeperStage(stage)}
                                        isBottleneckStage={hasBottleneckOrders(stage)}
                                        checkBottleneck={isBottleneck}
                                        onOrderClick={(order) => setSelectedOrder(order)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeOrder ? (
                        <div className="p-3 rounded-xl bg-white border-2 border-emerald-500 shadow-2xl opacity-90">
                            <p className="font-semibold text-slate-900 text-sm">{activeOrder.customer?.name}</p>
                            <p className="text-xs text-slate-500">{activeOrder.total_quantity} pcs</p>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <AddOrderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                customers={customers}
            />

            <OrderDetailModal
                order={selectedOrder}
                isOpen={selectedOrder !== null}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    )
}

