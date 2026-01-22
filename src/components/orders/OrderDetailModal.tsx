'use client'

import { useState, useEffect } from 'react'
import { Order, Customer, STAGE_LABELS, STAGES_ORDER, OrderStage, GATEKEEPER_STAGES, SPKSection, ProductionSpecs } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { SPKEditor } from '@/components/spk'
import { verifyDPPayment, moveOrderToNextStage } from '@/lib/actions/orders'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface OrderDetailModalProps {
    order: OrderWithCustomer | null
    isOpen: boolean
    onClose: () => void
}

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'detail' | 'payment' | 'stage' | 'spk'>('detail')
    const [trackingNumber, setTrackingNumber] = useState('')
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
    const [uploadingProof, setUploadingProof] = useState(false)
    const [dpDesainAmount, setDpDesainAmount] = useState('')
    const [dpProduksiAmount, setDpProduksiAmount] = useState('')
    const [pelunasanAmount, setPelunasanAmount] = useState('')
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [orderInvoice, setOrderInvoice] = useState<{ id: string; no_invoice: string; total: number; sisa_tagihan: number } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Fetch invoice for this order
    useEffect(() => {
        const fetchInvoice = async () => {
            if (!order?.id) return
            const { data } = await supabase
                .from('invoices')
                .select('id, no_invoice, total, sisa_tagihan')
                .eq('order_id', order.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            setOrderInvoice(data || null)
        }
        fetchInvoice()
    }, [order?.id, supabase])

    // Update trackingNumber when order changes
    if (order?.tracking_number && trackingNumber === '' && order.tracking_number !== trackingNumber) {
        setTrackingNumber(order.tracking_number)
    }

    // Determine if order is ready to move to next stage
    const getStageReadiness = (): boolean => {
        if (!order) return false
        const stage = order.stage as OrderStage

        switch (stage) {
            case 'customer_dp_desain':
                return order.dp_desain_verified
            case 'proses_desain':
                return order.mockup_url !== null
            case 'proses_layout':
                return order.layout_completed
            case 'dp_produksi':
                // Must have: invoice + dp verified + SPK data filled
                const hasInvoice = orderInvoice !== null
                const hasSPK = (order.size_breakdown && Object.keys(order.size_breakdown).length > 0) ||
                    (order.spk_sections && order.spk_sections.length > 0)
                return !!(order.dp_produksi_verified && hasInvoice && hasSPK)
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

    const isReady = getStageReadiness()

    if (!isOpen || !order) return null

    // Handle save tracking number
    const handleSaveTrackingNumber = async () => {
        if (!trackingNumber.trim()) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    tracking_number: trackingNumber.trim(),
                    shipped_at: new Date().toISOString()
                })
                .eq('id', order.id)

            if (error) throw error
            router.refresh()
            onClose()
        } catch (err) {
            console.error('Save tracking error:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const formatDate = (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    // Get next stage in sequence
    const getNextStage = (): OrderStage | null => {
        const currentIndex = STAGES_ORDER.indexOf(order.stage)
        if (currentIndex < STAGES_ORDER.length - 1) {
            return STAGES_ORDER[currentIndex + 1]
        }
        return null
    }

    // Manual completion stages that require admin checkbox confirmation
    const MANUAL_STAGES: OrderStage[] = ['proses_layout', 'antrean_produksi', 'print_press', 'cutting_jahit', 'packing']
    const isManualStage = MANUAL_STAGES.includes(order.stage as OrderStage)

    // Check if can move to next stage - must complete current stage first
    const canMoveToNextStage = () => {
        const stage = order.stage as OrderStage
        switch (stage) {
            case 'customer_dp_desain':
                return order.dp_desain_verified && getNextStage() !== null
            case 'proses_desain':
                return order.mockup_url !== null && getNextStage() !== null
            case 'proses_layout':
                return order.layout_completed && getNextStage() !== null
            case 'dp_produksi':
                // Require invoice AND DP verified to move from DP Produksi
                return order.dp_produksi_verified && orderInvoice !== null && getNextStage() !== null
            case 'antrean_produksi':
                return order.production_ready && getNextStage() !== null
            case 'print_press':
                return order.print_completed && getNextStage() !== null
            case 'cutting_jahit':
                return order.sewing_completed && getNextStage() !== null
            case 'packing':
                return order.packing_completed && getNextStage() !== null
            case 'pelunasan':
                return order.pelunasan_verified && getNextStage() !== null
            case 'pengiriman':
                return order.tracking_number !== null && order.shipped_at !== null
            default:
                return getNextStage() !== null
        }
    }

    // Handle payment verification with auto-kuitansi
    const handleVerifyPayment = async (type: 'dp_desain' | 'dp_produksi' | 'pelunasan', amount?: number) => {
        setLoading(true)
        try {
            const result = await verifyDPPayment(order.id, type, amount)

            if (!result.success) {
                toast.error(result.message)
                return
            }

            toast.success(result.message)
            router.refresh()
            onClose()
        } catch (err) {
            console.error('Verify error:', err)
            toast.error('Gagal verify pembayaran')
        } finally {
            setLoading(false)
        }
    }

    // Handle stage transition with auto-SPK generation
    const handleMoveToNextStage = async () => {
        const nextStage = getNextStage()
        if (!nextStage) return

        // Validate SPK created before moving OUT of antrean_produksi
        if (order.stage === 'antrean_produksi' && !order.spk_number) {
            toast.warning('Buat SPK terlebih dahulu sebelum melanjutkan ke tahap produksi')
            return
        }

        setLoading(true)
        try {
            const result = await moveOrderToNextStage(order.id, order.stage, nextStage)

            if (!result.success) {
                toast.error(result.message)
                return
            }

            if (result.spkGenerated) {
                toast.success('Berhasil pindah stage! SPK otomatis di-generate 🎉')
            } else {
                toast.success('Berhasil pindah stage')
            }

            router.refresh()
            onClose()
        } catch (err) {
            console.error('Move stage error:', err)
            const message = err instanceof Error ? err.message : 'Gagal pindah stage'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    // Payment status badge
    const getPaymentBadge = (verified: boolean, amount: number) => {
        if (verified) {
            return <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">✓ Verified</span>
        }
        if (amount > 0) {
            return <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">Pending</span>
        }
        return <span className="px-2 py-1 text-xs rounded-full bg-slate-500/20 text-slate-500">-</span>
    }

    const nextStage = getNextStage()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl m-4 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{order.customer?.name}</h2>
                        <p className="text-sm text-slate-500">{order.customer?.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${isReady
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : 'bg-red-500/20 text-red-600'
                            }`}>
                            {STAGE_LABELS[order.stage]}
                        </span>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs - Conditional based on stage */}
                <div className="flex border-b border-slate-200">
                    {/* Detail tab - always show */}
                    <button
                        onClick={() => setActiveTab('detail')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'detail'
                            ? isReady
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-red-500 border-b-2 border-red-500'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Detail
                    </button>
                    {/* Bayar tab - always show */}
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'payment'
                            ? isReady
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-red-500 border-b-2 border-red-500'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Bayar
                    </button>
                    {/* SPK tab - show at dp_produksi and onwards */}
                    {['dp_produksi', 'antrean_produksi', 'print_press', 'cutting_jahit', 'packing', 'pelunasan', 'pengiriman'].includes(order.stage) && (
                        <button
                            onClick={() => setActiveTab('spk')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'spk'
                                ? isReady
                                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                                    : 'text-red-500 border-b-2 border-red-500'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            SPK
                        </button>
                    )}
                    {/* Stage tab - always show */}
                    <button
                        onClick={() => setActiveTab('stage')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'stage'
                            ? isReady
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-red-500 border-b-2 border-red-500'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Stage
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Detail Tab */}
                    {activeTab === 'detail' && (
                        <div className="space-y-6">
                            {/* Customer Info - Show at early stages */}
                            {['customer_dp_desain', 'proses_desain', 'proses_layout'].includes(order.stage) && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <p className="text-xs text-blue-600 mb-3 font-medium">Info Customer</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                                {order.customer?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{order.customer?.name}</p>
                                                <p className="text-sm text-slate-600">{order.customer?.phone}</p>
                                            </div>
                                        </div>
                                        {order.customer?.alamat && (
                                            <p className="text-sm text-slate-600 pl-13">
                                                <span className="text-slate-400">Alamat:</span> {order.customer.alamat}
                                            </p>
                                        )}
                                        {order.customer?.kota && (
                                            <p className="text-sm text-slate-600">
                                                <span className="text-slate-400">Kota:</span> {order.customer.kota}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mockup or Layout Preview */}
                            {(order.layout_url || order.mockup_url) && (
                                <div className="space-y-2">
                                    <div
                                        className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
                                        onClick={() => setPreviewImage(order.layout_url || order.mockup_url)}
                                    >
                                        <Image
                                            src={order.layout_url || order.mockup_url || ''}
                                            alt={order.layout_url ? "Layout Final" : "Mockup Desain"}
                                            fill
                                            className="object-contain"
                                        />
                                        {/* Label Badge */}
                                        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                                            {order.layout_url ? "Layout Final" : "Mockup Desain"}
                                        </div>
                                    </div>
                                    {/* If showing layout, show link to view original mockup? */}
                                    {order.layout_url && order.mockup_url && (
                                        <p
                                            className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer text-center"
                                            onClick={() => setPreviewImage(order.mockup_url)}
                                        >
                                            Lihat Original Mockup
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-1">Jumlah</p>
                                    <p className="text-xl font-bold text-slate-900">{order.total_quantity} pcs</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-1">Deadline</p>
                                    <p className="text-xl font-bold text-slate-900">{formatDate(order.deadline)}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {order.order_description && (
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-2">Deskripsi Order</p>
                                    <p className="text-slate-900 whitespace-pre-wrap">{order.order_description}</p>
                                </div>
                            )}

                            {/* Size Breakdown */}
                            {order.size_breakdown && Object.keys(order.size_breakdown).length > 0 && (
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-3">Breakdown Ukuran</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(order.size_breakdown).map(([size, qty]) => (
                                            <div key={size} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-center min-w-[50px]">
                                                <p className="text-xs text-slate-500">{size}</p>
                                                <p className="text-lg font-bold text-slate-900">{qty}</p>
                                            </div>
                                        ))}
                                        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center min-w-[60px]">
                                            <p className="text-xs text-emerald-600">Total</p>
                                            <p className="text-lg font-bold text-emerald-600">
                                                {Object.values(order.size_breakdown).reduce((a, b) => a + b, 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Production Notes */}
                            {order.production_notes && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                    <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Catatan Produksi
                                    </p>
                                    <p className="text-slate-900 whitespace-pre-wrap">{order.production_notes}</p>
                                </div>
                            )}

                            {/* SPK Number */}
                            {order.spk_number && (
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-600">Nomor SPK</p>
                                        <p className="font-mono font-bold text-blue-800">{order.spk_number}</p>
                                    </div>
                                    <button
                                        className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                                        onClick={() => {
                                            // TODO: Print SPK
                                            alert('Fitur Print SPK coming soon!')
                                        }}
                                    >
                                        Print SPK
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Tab */}
                    {activeTab === 'payment' && (
                        <div className="space-y-4">
                            {/* Current Payment Stage Header */}
                            <div className={`p-3 rounded-lg ${isReady ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                <p className="text-xs text-slate-500">Stage: <span className={`font-medium ${isReady ? 'text-emerald-600' : 'text-red-600'}`}>{STAGE_LABELS[order.stage]}</span></p>
                            </div>

                            {/* Invoice Info Card - Show if invoice exists */}
                            {orderInvoice && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-sm font-semibold text-blue-800">Invoice</span>
                                        </div>
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                                            ✓ Dibuat
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">No. Invoice</span>
                                            <span className="font-mono font-medium text-slate-900">{orderInvoice.no_invoice}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Total Invoice</span>
                                            <span className="font-semibold text-slate-900">{formatCurrency(orderInvoice.total)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Total Dibayar</span>
                                            <span className="font-semibold text-emerald-600">
                                                {formatCurrency(order.dp_desain_amount + order.dp_produksi_amount + order.pelunasan_amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                                            <span className="text-slate-700 font-medium">Sisa Tagihan</span>
                                            {(() => {
                                                const totalDibayar = order.dp_desain_amount + order.dp_produksi_amount + order.pelunasan_amount
                                                const sisaTagihan = orderInvoice.total - totalDibayar
                                                return (
                                                    <span className={`font-bold ${sisaTagihan > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {formatCurrency(sisaTagihan)}
                                                    </span>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/invoices/${orderInvoice.id}`}
                                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Lihat Invoice
                                    </Link>
                                </div>
                            )}
                            {/* DP Desain - Show only at customer_dp_desain stage OR if already verified */}
                            {(order.stage === 'customer_dp_desain' || order.dp_desain_verified) && (
                                <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-slate-900">DP Desain</p>
                                        {getPaymentBadge(order.dp_desain_verified, order.dp_desain_amount)}
                                    </div>

                                    {order.dp_desain_verified ? (
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(order.dp_desain_amount)}</p>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                                <input
                                                    type="number"
                                                    value={dpDesainAmount || order.dp_desain_amount || ''}
                                                    onChange={(e) => setDpDesainAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const amount = parseInt(dpDesainAmount) || 0
                                                    if (amount <= 0) {
                                                        toast.warning('Masukkan nominal DP Desain')
                                                        return
                                                    }
                                                    await handleVerifyPayment('dp_desain', amount)
                                                }}
                                                disabled={loading}
                                                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-600 disabled:opacity-50 whitespace-nowrap"
                                            >
                                                Simpan & Verify
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DP Produksi - Show only at dp_produksi stage OR if already verified */}
                            {(order.stage === 'dp_produksi' || order.dp_produksi_verified) && (
                                <div className={`p-4 rounded-xl space-y-3 ${GATEKEEPER_STAGES.includes('dp_produksi') ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-50'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900">DP Produksi</p>
                                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        {getPaymentBadge(order.dp_produksi_verified, order.dp_produksi_amount)}
                                    </div>

                                    {order.dp_produksi_verified ? (
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(order.dp_produksi_amount)}</p>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                                <input
                                                    type="number"
                                                    value={dpProduksiAmount || order.dp_produksi_amount || ''}
                                                    onChange={(e) => setDpProduksiAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const amount = parseInt(dpProduksiAmount) || 0
                                                    if (amount <= 0) {
                                                        toast.warning('Masukkan nominal DP Produksi')
                                                        return
                                                    }
                                                    await handleVerifyPayment('dp_produksi', amount)
                                                }}
                                                disabled={loading}
                                                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-600 disabled:opacity-50 whitespace-nowrap"
                                            >
                                                Simpan & Verify
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pelunasan - Show only at pelunasan stage OR if already verified */}
                            {(order.stage === 'pelunasan' || order.pelunasan_verified) && (
                                <div className={`p-4 rounded-xl space-y-3 ${GATEKEEPER_STAGES.includes('pelunasan') ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-50'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900">Pelunasan</p>
                                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        {getPaymentBadge(order.pelunasan_verified, order.pelunasan_amount)}
                                    </div>

                                    {order.pelunasan_verified ? (
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(order.pelunasan_amount)}</p>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                                <input
                                                    type="number"
                                                    value={pelunasanAmount || order.pelunasan_amount || ''}
                                                    onChange={(e) => setPelunasanAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const amount = parseInt(pelunasanAmount) || 0
                                                    if (amount <= 0) {
                                                        toast.warning('Masukkan nominal Pelunasan')
                                                        return
                                                    }
                                                    await handleVerifyPayment('pelunasan', amount)
                                                }}
                                                disabled={loading}
                                                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-600 disabled:opacity-50 whitespace-nowrap"
                                            >
                                                Simpan & Verify
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Total */}
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                <p className="text-sm text-slate-500">Total Pembayaran</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {formatCurrency(order.dp_desain_amount + order.dp_produksi_amount + order.pelunasan_amount)}
                                </p>
                            </div>

                            {/* Payment Proof Upload */}
                            <div className="p-4 rounded-xl bg-slate-50">
                                <p className="text-sm font-medium text-slate-900 mb-3">Bukti Pembayaran</p>

                                {/* Show existing proof if available */}
                                {order.dp_desain_proof_url && (
                                    <div
                                        className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-white cursor-zoom-in hover:opacity-95 transition-opacity"
                                        onClick={() => setPreviewImage(order.dp_desain_proof_url)}
                                    >
                                        <Image src={order.dp_desain_proof_url} alt="Bukti Pembayaran" fill className="object-contain" />
                                    </div>
                                )}

                                {/* Upload form */}
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setPaymentProofFile(file)
                                                setPaymentProofPreview(URL.createObjectURL(file))
                                            }
                                        }}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-200 file:text-slate-900 hover:file:bg-slate-600"
                                    />

                                    {paymentProofPreview && (
                                        <div
                                            className="relative w-full h-40 rounded-lg overflow-hidden bg-white cursor-zoom-in hover:opacity-95 transition-opacity"
                                            onClick={() => setPreviewImage(paymentProofPreview)}
                                        >
                                            <Image src={paymentProofPreview} alt="Preview" fill className="object-contain" />
                                        </div>
                                    )}

                                    {paymentProofFile && (
                                        <button
                                            onClick={async () => {
                                                if (!paymentProofFile || !order) return
                                                setUploadingProof(true)
                                                try {
                                                    const fileExt = paymentProofFile.name.split('.').pop()
                                                    const filePath = `payment-proofs/${order.id}/${Date.now()}.${fileExt}`

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('order-assets')
                                                        .upload(filePath, paymentProofFile)

                                                    if (uploadError) {
                                                        console.error('Storage error:', uploadError)
                                                        toast.error(`Gagal upload: ${uploadError.message}`)
                                                        return
                                                    }

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('order-assets')
                                                        .getPublicUrl(filePath)

                                                    // Use dp_desain_proof_url as general payment proof
                                                    const { error: updateError } = await supabase
                                                        .from('orders')
                                                        .update({ dp_desain_proof_url: publicUrl })
                                                        .eq('id', order.id)

                                                    if (updateError) {
                                                        console.error('Update error:', updateError)
                                                        toast.error(`Gagal update: ${updateError.message}`)
                                                        return
                                                    }

                                                    setPaymentProofFile(null)
                                                    setPaymentProofPreview(null)
                                                    router.refresh()
                                                    toast.success('Bukti pembayaran berhasil diupload!')
                                                } catch (err: unknown) {
                                                    console.error('Upload error:', err)
                                                    const message = err instanceof Error ? err.message : 'Unknown error'
                                                    toast.error(`Gagal upload bukti pembayaran: ${message}`)
                                                } finally {
                                                    setUploadingProof(false)
                                                }
                                            }}
                                            disabled={uploadingProof}
                                            className="w-full py-2 px-4 rounded-lg bg-blue-500 text-slate-900 font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                        >
                                            {uploadingProof ? 'Uploading...' : 'Upload Bukti'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage Tab */}
                    {activeTab === 'stage' && (
                        <div className="space-y-4">
                            {/* Current Stage */}
                            <div className={`p-4 rounded-xl ${isReady
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                                }`}>
                                <p className="text-xs text-slate-500 mb-1">Stage Saat Ini</p>
                                <p className={`text-xl font-bold ${isReady ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {STAGE_LABELS[order.stage]}
                                </p>
                            </div>

                            {/* Next Stage */}
                            {nextStage && (
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-1">Stage Berikutnya</p>
                                    <p className="text-xl font-bold text-slate-900">{STAGE_LABELS[nextStage]}</p>
                                </div>
                            )}

                            {/* Invoice & DP Status Checklist for dp_produksi stage */}
                            {order.stage === 'dp_produksi' && (
                                <div className="space-y-2">
                                    {/* Invoice Status Row */}
                                    <div className={`p-3 rounded-lg flex items-center justify-between ${orderInvoice ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'}`}>
                                        <div className="flex items-center gap-2">
                                            {orderInvoice ? (
                                                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            <span className={`font-medium ${orderInvoice ? 'text-emerald-700' : 'text-orange-700'}`}>
                                                Invoice
                                            </span>
                                            {orderInvoice && (
                                                <span className="text-sm text-slate-500 font-mono">{orderInvoice.no_invoice}</span>
                                            )}
                                        </div>
                                        {orderInvoice ? (
                                            <Link
                                                href={`/invoices/${orderInvoice.id}`}
                                                className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                            >
                                                Lihat
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/invoices/new?order_id=${order.id}`}
                                                className="px-3 py-1 text-xs font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                            >
                                                + Buat
                                            </Link>
                                        )}
                                    </div>

                                    {/* DP Produksi Status Row */}
                                    <div className={`p-3 rounded-lg flex items-center justify-between ${order.dp_produksi_verified ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                                        <div className="flex items-center gap-2">
                                            {order.dp_produksi_verified ? (
                                                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            )}
                                            <span className={`font-medium ${order.dp_produksi_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                DP Produksi
                                            </span>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.dp_produksi_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {order.dp_produksi_verified ? '✓ Verified' : 'Belum diverifikasi'}
                                        </span>
                                    </div>

                                    {/* SPK Status Row */}
                                    {(() => {
                                        const hasSPK = (order.size_breakdown && Object.keys(order.size_breakdown).length > 0) ||
                                            (order.spk_sections && order.spk_sections.length > 0)
                                        return (
                                            <div className={`p-3 rounded-lg flex items-center justify-between ${hasSPK ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'}`}>
                                                <div className="flex items-center gap-2">
                                                    {hasSPK ? (
                                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    )}
                                                    <span className={`font-medium ${hasSPK ? 'text-emerald-700' : 'text-orange-700'}`}>
                                                        SPK Data
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${hasSPK ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {hasSPK ? '✓ Sudah diisi' : 'Belum diisi'}
                                                </span>
                                            </div>
                                        )
                                    })()}

                                    {/* Help text */}
                                    {(() => {
                                        const hasSPKData = (order.size_breakdown && Object.keys(order.size_breakdown).length > 0) ||
                                            (order.spk_sections && order.spk_sections.length > 0)
                                        if (orderInvoice && order.dp_produksi_verified && hasSPKData) return null
                                        return (
                                            <p className="text-xs text-slate-500 text-center py-2">
                                                {!orderInvoice ? 'Buat Invoice terlebih dahulu' :
                                                    !order.dp_produksi_verified ? 'Verifikasi DP di Tab Bayar' :
                                                        'Isi SPK di Tab SPK untuk melanjutkan'}
                                            </p>
                                        )
                                    })()}
                                </div>
                            )}


                            {/* Layout Section for proses_layout */}
                            {order.stage === 'proses_layout' && (
                                <div className="space-y-4">
                                    {/* Info - Only show if no layout link yet */}
                                    {!order.layout_url && (
                                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                                            <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            <div>
                                                <p className="text-blue-400 font-medium">Masukkan Link Google Drive</p>
                                                <p className="text-sm text-slate-500">Upload layout ke Google Drive lalu paste link sharing di sini.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Link Input Area */}
                                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                        <p className="text-sm font-medium text-slate-900 mb-3">
                                            Link Layout Final (Google Drive)
                                        </p>

                                        <div className="space-y-3">
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="url"
                                                    id="layout-drive-link"
                                                    defaultValue={order.layout_url || ''}
                                                    placeholder="https://drive.google.com/..."
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                {order.layout_url && (
                                                    <a
                                                        href={order.layout_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        Buka di Drive
                                                    </a>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        const input = document.getElementById('layout-drive-link') as HTMLInputElement
                                                        const link = input?.value?.trim()

                                                        if (!link) {
                                                            toast.warning('Masukkan link Google Drive')
                                                            return
                                                        }

                                                        // Simple validation for Google Drive links
                                                        if (!link.includes('drive.google.com') && !link.includes('docs.google.com')) {
                                                            toast.warning('Link harus dari Google Drive')
                                                            return
                                                        }

                                                        try {
                                                            setLoading(true)
                                                            const { error } = await supabase
                                                                .from('orders')
                                                                .update({
                                                                    layout_url: link,
                                                                    layout_completed: true,
                                                                    layout_completed_at: new Date().toISOString()
                                                                } as any)
                                                                .eq('id', order.id)

                                                            if (error) throw error
                                                            toast.success('Link layout berhasil disimpan!')
                                                            router.refresh()
                                                        } catch (err) {
                                                            console.error('Error saving layout link:', err)
                                                            toast.error('Gagal menyimpan link')
                                                        } finally {
                                                            setLoading(false)
                                                        }
                                                    }}
                                                    disabled={loading}
                                                    className={`${order.layout_url ? '' : 'flex-1'} flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Simpan Link
                                                </button>
                                            </div>

                                            {order.layout_url && (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Hapus link layout ini?')) return

                                                        try {
                                                            const { error } = await supabase
                                                                .from('orders')
                                                                .update({
                                                                    layout_url: null,
                                                                    layout_completed: false,
                                                                    layout_completed_at: null
                                                                } as any)
                                                                .eq('id', order.id)

                                                            if (error) throw error
                                                            toast.success('Link dihapus')
                                                            router.refresh()
                                                        } catch (err) {
                                                            toast.error('Gagal menghapus link')
                                                        }
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-600 font-medium text-center"
                                                >
                                                    Hapus Link
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Design Gatekeeper Warning for proses_desain */}
                            {order.stage === 'proses_desain' && !order.mockup_url && (
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <p className="text-blue-400 font-medium">Desain belum diupload</p>
                                        <p className="text-sm text-slate-500">Upload desain yang sudah di-ACC customer untuk pindah ke DP Produksi</p>
                                    </div>
                                </div>
                            )}

                            {/* Mockup Upload for proses_desain */}
                            {order.stage === 'proses_desain' && (
                                <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                                    <p className="text-sm font-medium text-slate-900">Upload Desain Final</p>

                                    {order.mockup_url && (
                                        <div
                                            className="relative w-full h-40 rounded-lg overflow-hidden bg-white cursor-zoom-in hover:opacity-95 transition-opacity"
                                            onClick={() => setPreviewImage(order.mockup_url)}
                                        >
                                            <Image src={order.mockup_url} alt="Desain" fill className="object-contain" />
                                            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-emerald-500 text-slate-900 text-xs font-medium">
                                                ✓ Uploaded
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return

                                            setLoading(true)
                                            try {
                                                const fileExt = file.name.split('.').pop()
                                                const filePath = `mockups/${order.id}/${Date.now()}.${fileExt}`

                                                const { error: uploadError } = await supabase.storage
                                                    .from('order-assets')
                                                    .upload(filePath, file)

                                                if (uploadError) {
                                                    toast.error(`Gagal upload: ${uploadError.message}`)
                                                    return
                                                }

                                                const { data: { publicUrl } } = supabase.storage
                                                    .from('order-assets')
                                                    .getPublicUrl(filePath)

                                                const { error: updateError } = await supabase
                                                    .from('orders')
                                                    .update({ mockup_url: publicUrl })
                                                    .eq('id', order.id)

                                                if (updateError) {
                                                    toast.error(`Gagal update: ${updateError.message}`)
                                                    return
                                                }

                                                // Close modal and refresh to show changes in Kanban
                                                toast.success('Desain berhasil diupload!')
                                                onClose()
                                                router.refresh()
                                            } catch (err) {
                                                console.error('Upload error:', err)
                                                toast.error('Gagal upload desain')
                                            } finally {
                                                setLoading(false)
                                            }
                                        }}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-slate-900 hover:file:bg-blue-600"
                                    />
                                </div>
                            )}

                            {/* Gatekeeper Warning */}
                            {(order.stage === 'dp_produksi' && !order.dp_produksi_verified) && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                                    <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <div>
                                        <p className="text-amber-400 font-medium">DP Produksi belum diverifikasi</p>
                                        <p className="text-sm text-slate-500">Verifikasi pembayaran DP 50% terlebih dahulu</p>
                                    </div>
                                </div>
                            )}

                            {(order.stage === 'pelunasan' && !order.pelunasan_verified) && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                                    <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <div>
                                        <p className="text-amber-400 font-medium">Pelunasan belum diverifikasi</p>
                                        <p className="text-sm text-slate-500">Verifikasi pembayaran penuh terlebih dahulu</p>
                                    </div>
                                </div>
                            )}

                            {/* Tracking Number Input for Pengiriman Stage */}
                            {order.stage === 'pengiriman' && (
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                    <p className="text-sm font-medium text-slate-900 mb-2">No. Resi / Tracking Number</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="JNE123456789"
                                            className="flex-1 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                        <button
                                            onClick={handleSaveTrackingNumber}
                                            disabled={loading || !trackingNumber.trim()}
                                            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? 'Saving...' : 'Simpan'}
                                        </button>
                                    </div>
                                    {order.shipped_at && (
                                        <p className="mt-2 text-xs text-emerald-600 font-medium">
                                            ✓ Dikirim: {new Date(order.shipped_at).toLocaleDateString('id-ID')}
                                        </p>
                                    )}
                                    {!order.tracking_number && (
                                        <p className="mt-2 text-xs text-amber-500">
                                            Isi no resi dan klik Simpan untuk menandai pesanan sudah dikirim
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Manual Stage Completion Toggle */}
                            {isManualStage && nextStage && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <p className="text-sm font-medium text-slate-900 mb-3">
                                        Status Proses {STAGE_LABELS[order.stage]}
                                    </p>
                                    <button
                                        onClick={async () => {
                                            setLoading(true)
                                            try {
                                                const stage = order.stage as OrderStage
                                                let updateField = ''
                                                let timestampField = ''
                                                let currentValue = false

                                                switch (stage) {
                                                    case 'proses_layout':
                                                        updateField = 'layout_completed'
                                                        timestampField = 'layout_completed_at'
                                                        currentValue = order.layout_completed
                                                        break
                                                    case 'antrean_produksi':
                                                        updateField = 'production_ready'
                                                        timestampField = 'production_ready_at'
                                                        currentValue = order.production_ready
                                                        break
                                                    case 'print_press':
                                                        updateField = 'print_completed'
                                                        timestampField = 'print_completed_at'
                                                        currentValue = order.print_completed
                                                        break
                                                    case 'cutting_jahit':
                                                        updateField = 'sewing_completed'
                                                        timestampField = 'sewing_completed_at'
                                                        currentValue = order.sewing_completed
                                                        break
                                                    case 'packing':
                                                        updateField = 'packing_completed'
                                                        timestampField = 'packing_completed_at'
                                                        currentValue = order.packing_completed
                                                        break
                                                }

                                                const newValue = !currentValue
                                                const updateData: Record<string, boolean | string | null> = {
                                                    [updateField]: newValue,
                                                    [timestampField]: newValue ? new Date().toISOString() : null
                                                }

                                                const { error } = await supabase
                                                    .from('orders')
                                                    .update(updateData)
                                                    .eq('id', order.id)

                                                if (error) throw error
                                                router.refresh()
                                                onClose()
                                            } catch (err) {
                                                console.error('Toggle stage error:', err)
                                                toast.error('Gagal mengupdate status')
                                            } finally {
                                                setLoading(false)
                                            }
                                        }}
                                        disabled={loading}
                                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border-2 ${isReady
                                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                            : 'border-red-400 text-red-500 bg-red-50 hover:bg-red-100'
                                            } disabled:opacity-50`}
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : isReady ? (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Selesai - Klik untuk batalkan
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Belum Selesai - Klik untuk tandai selesai
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Move Button */}
                            {nextStage && (
                                <button
                                    onClick={handleMoveToNextStage}
                                    disabled={loading || !canMoveToNextStage()}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <>
                                            Pindah ke {STAGE_LABELS[nextStage]}
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            )}

                            {order.stage === 'pengiriman' && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                                    <p className="text-emerald-400 font-medium">🎉 Order sudah di tahap akhir!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPK Tab */}
                    {activeTab === 'spk' && (
                        <SPKEditor
                            orderId={order.id}
                            namaPo={order.nama_po || null}
                            sections={(order.spk_sections as SPKSection[]) || []}
                            productionSpecs={(order.production_specs as ProductionSpecs) || null}
                            productionNotes={order.production_notes}
                            onSave={async (data) => {
                                try {
                                    const { error } = await supabase
                                        .from('orders')
                                        .update({
                                            nama_po: data.nama_po,
                                            spk_sections: data.spk_sections,
                                            production_specs: data.production_specs,
                                            production_notes: data.production_notes,
                                        })
                                        .eq('id', order.id)

                                    if (error) throw error
                                    toast.success('SPK data berhasil disimpan!')
                                    router.refresh()
                                } catch (err) {
                                    console.error('Save SPK error:', err)
                                    toast.error('Gagal menyimpan SPK data')
                                    throw err
                                }
                            }}
                            isLoading={loading}
                        />
                    )}
                </div>
            </div>
            {/* Image Preview Lightbox */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[101]"
                        onClick={() => setPreviewImage(null)}
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <Image
                            src={previewImage}
                            alt="Preview"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            )}
        </div >
    )
}
