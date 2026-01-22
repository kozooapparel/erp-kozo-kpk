'use client'

import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Order, Customer, OrderStage } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface OrderWithCustomer extends Order {
    customer: Customer
    creator: { id: string; full_name: string } | null
    brand?: { id: string; code: string; name: string; logo_url: string | null } | null
}

interface DraggableOrderCardProps {
    order: OrderWithCustomer
    isBottleneck: boolean
    onClick: () => void
}

export default function DraggableOrderCard({ order, isBottleneck, onClick }: DraggableOrderCardProps) {
    const supabase = createClient()
    const [hasInvoice, setHasInvoice] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id })

    // Check if order has invoice (for dp_produksi stage)
    useEffect(() => {
        const checkInvoice = async () => {
            if (order.stage !== 'dp_produksi') {
                setHasInvoice(true) // Not relevant for other stages
                return
            }
            const { data } = await supabase
                .from('invoices')
                .select('id')
                .eq('order_id', order.id)
                .limit(1)
                .single()
            setHasInvoice(!!data)
        }
        checkInvoice()
    }, [order.id, order.stage, supabase])

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

    // Format order age from created_at
    const formatOrderAge = (createdAt: string): string => {
        const created = new Date(createdAt)
        const now = new Date()
        const diffMs = now.getTime() - created.getTime()

        const minutes = Math.floor(diffMs / (1000 * 60))
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const weeks = Math.floor(days / 7)

        if (weeks >= 1) {
            const remainingDays = days % 7
            return remainingDays > 0 ? `${weeks} minggu ${remainingDays} hari` : `${weeks} minggu`
        }
        if (days >= 1) {
            const remainingHours = hours % 24
            return remainingHours > 0 ? `${days} hari ${remainingHours} jam` : `${days} hari`
        }
        if (hours >= 1) {
            const remainingMinutes = minutes % 60
            return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} menit` : `${hours} jam`
        }
        return `${minutes} menit`
    }

    // State for order age timer
    const [orderAge, setOrderAge] = useState(() => formatOrderAge(order.created_at))
    const [isOverOneDay, setIsOverOneDay] = useState(() => {
        const created = new Date(order.created_at)
        const now = new Date()
        const diffMs = now.getTime() - created.getTime()
        return diffMs >= 24 * 60 * 60 * 1000
    })

    // Update timer every hour
    useEffect(() => {
        const updateAge = () => {
            setOrderAge(formatOrderAge(order.created_at))
            const created = new Date(order.created_at)
            const now = new Date()
            const diffMs = now.getTime() - created.getTime()
            setIsOverOneDay(diffMs >= 24 * 60 * 60 * 1000)
        }

        // Initial update
        updateAge()

        // Update every minute (60000ms)
        const interval = setInterval(updateAge, 60000)

        return () => clearInterval(interval)
    }, [order.created_at])

    // Get stage-specific status badge (green = ready, red = not ready)
    const getStageStatus = (): { label: string; isReady: boolean } => {
        const stage = order.stage as OrderStage

        switch (stage) {
            case 'customer_dp_desain':
                return {
                    label: order.dp_desain_verified ? 'Sudah DP' : 'Belum Bayar',
                    isReady: order.dp_desain_verified
                }
            case 'proses_desain':
                return {
                    label: order.mockup_url ? 'Sudah ACC' : 'Belum ACC',
                    isReady: order.mockup_url !== null
                }
            case 'proses_layout':
                return {
                    label: order.layout_completed ? 'Selesai' : 'Belum Selesai',
                    isReady: order.layout_completed
                }
            case 'dp_produksi':
                // Need invoice + DP verified + SPK filled
                const hasSPK = (order.size_breakdown && Object.keys(order.size_breakdown).length > 0) ||
                    (order.spk_sections && order.spk_sections.length > 0)
                const dpReady = order.dp_produksi_verified && hasInvoice && hasSPK
                const dpLabel = !hasInvoice ? 'Belum Invoice' :
                    !hasSPK ? 'Belum SPK' :
                        order.dp_produksi_verified ? 'Sudah DP' : 'Belum DP'
                return {
                    label: dpLabel,
                    isReady: dpReady
                }
            case 'antrean_produksi':
                return {
                    label: order.production_ready ? 'Selesai' : 'Belum Selesai',
                    isReady: order.production_ready
                }
            case 'print_press':
                return {
                    label: order.print_completed ? 'Selesai' : 'Belum Selesai',
                    isReady: order.print_completed
                }
            case 'cutting_jahit':
                return {
                    label: order.sewing_completed ? 'Selesai' : 'Belum Selesai',
                    isReady: order.sewing_completed
                }
            case 'packing':
                return {
                    label: order.packing_completed ? 'Selesai' : 'Belum Selesai',
                    isReady: order.packing_completed
                }
            case 'pelunasan':
                return {
                    label: order.pelunasan_verified ? 'Sudah Lunas' : 'Belum Lunas',
                    isReady: order.pelunasan_verified
                }
            case 'pengiriman':
                return {
                    label: (order.tracking_number && order.shipped_at) ? 'Sudah Kirim' : 'Belum Kirim',
                    isReady: order.tracking_number !== null && order.shipped_at !== null
                }
            default:
                return { label: 'Unknown', isReady: false }
        }
    }

    // Determine if order is ready to move to next stage (uses same logic as getStageStatus)
    const getStageReadiness = (): { isReady: boolean; reason?: string } => {
        const stageStatus = getStageStatus()
        return {
            isReady: stageStatus.isReady,
            reason: stageStatus.isReady ? undefined : stageStatus.label
        }
    }

    const stageStatus = getStageStatus()
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
            <div className={`pt-2 px-1.5 pb-1.5 rounded-2xl transition-all ${stageReadiness.isReady
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : 'bg-red-100 dark:bg-red-900/50'
                } ${isDragging ? 'ring-2 ring-offset-2 ring-emerald-500' : ''} ${isBottleneck ? 'ring-2 ring-red-400 animate-pulse' : ''
                }`}>

                {/* Header Status - In outer container padding area */}
                <div className={`flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider ${stageReadiness.isReady
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${stageReadiness.isReady ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-red-500 ring-2 ring-red-300'
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
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">

                    {/* Card Content */}
                    <div className="p-2.5">
                        {/* Thumbnail Logic */}
                        {/* 1. Proses Desain: Show Mockup */}
                        {order.stage === 'proses_desain' && (
                            <div className="relative mb-2">
                                {order.mockup_url ? (
                                    <div className="relative w-full h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <Image src={order.mockup_url} alt="Mockup" fill className="object-cover pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="w-full h-16 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-200">
                                        <span className="text-[10px] text-slate-400">No Mockup</span>
                                    </div>
                                )}
                            </div>
                        )}



                        {/* Customer Name with Brand Logo */}
                        <div className="flex items-center gap-1.5 mb-1">
                            {order.brand?.logo_url && (
                                <div className="w-4 h-4 relative flex-shrink-0">
                                    <Image
                                        src={order.brand.logo_url}
                                        alt={order.brand.name || 'Brand'}
                                        fill
                                        className="object-contain rounded-sm"
                                    />
                                </div>
                            )}
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                                {order.customer?.name || 'Unknown'}
                            </h4>
                        </div>

                        {/* Nama PO - Show from proses_layout stage onwards if SPK is filled */}
                        {order.nama_po && ['proses_layout', 'dp_produksi', 'antrean_produksi', 'print_press', 'cutting_jahit', 'packing', 'pelunasan', 'pengiriman'].includes(order.stage) && (
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mb-1">
                                PO: <span className="text-slate-700 dark:text-slate-200 font-semibold">{order.nama_po}</span>
                            </p>
                        )}

                        {/* Order Details Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px]">
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    {order.total_quantity}pcs
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

                            {/* Stage Status Badge - Bottom Right */}
                            <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full text-white ${stageStatus.isReady ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                {stageStatus.label}
                            </span>
                        </div>

                        {/* Admin Badge with Order Age Timer */}
                        {order.creator?.full_name && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-medium">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {order.creator.full_name}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isOverOneDay
                                    ? 'bg-red-200 text-red-700'
                                    : 'bg-slate-200 text-slate-600'
                                    }`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {orderAge}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
