'use client'

import { useState } from 'react'
import { Order, Customer, STAGE_LABELS, STAGES_ORDER, OrderStage, GATEKEEPER_STAGES } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    const [activeTab, setActiveTab] = useState<'detail' | 'payment' | 'stage'>('detail')
    const [trackingNumber, setTrackingNumber] = useState('')
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
    const [uploadingProof, setUploadingProof] = useState(false)
    const [dpProduksiAmount, setDpProduksiAmount] = useState('')
    const [pelunasanAmount, setPelunasanAmount] = useState('')
    const router = useRouter()
    const supabase = createClient()

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
                return order.dp_produksi_verified && getNextStage() !== null
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

    // Handle payment verification
    const handleVerifyPayment = async (type: 'dp_desain' | 'dp_produksi' | 'pelunasan') => {
        setLoading(true)
        try {
            const updateData: Record<string, boolean | string> = {}
            updateData[`${type}_verified`] = true
            updateData[`${type}_verified_at`] = new Date().toISOString()

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', order.id)

            if (error) throw error
            router.refresh()
            onClose()
        } catch (err) {
            console.error('Verify error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Handle stage transition
    const handleMoveToNextStage = async () => {
        const nextStage = getNextStage()
        if (!nextStage) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    stage: nextStage,
                    stage_entered_at: new Date().toISOString()
                })
                .eq('id', order.id)

            if (error) throw error
            router.refresh()
            onClose()
        } catch (err) {
            console.error('Move stage error:', err)
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

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    {(['detail', 'payment', 'stage'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                ? isReady
                                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                                    : 'text-red-500 border-b-2 border-red-500'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {tab === 'detail' ? 'Detail Order' : tab === 'payment' ? 'Pembayaran' : 'Pindah Stage'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Detail Tab */}
                    {activeTab === 'detail' && (
                        <div className="space-y-6">
                            {/* Mockup */}
                            {order.mockup_url && (
                                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100">
                                    <Image src={order.mockup_url} alt="Mockup" fill className="object-contain" />
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

                            {/* Tracking Number - Editable in Pengiriman stage */}
                            {order.stage === 'pengiriman' && (
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                    <p className="text-xs text-slate-500 mb-2">No. Resi / Tracking Number</p>
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
                                            className="px-4 py-2 rounded-lg bg-blue-500 text-slate-900 font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? 'Saving...' : 'Simpan'}
                                        </button>
                                    </div>
                                    {order.shipped_at && (
                                        <p className="mt-2 text-xs text-slate-500">
                                            Dikirim: {new Date(order.shipped_at).toLocaleDateString('id-ID')}
                                        </p>
                                    )}
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

                            {/* DP Desain - Show only at customer_dp_desain stage OR if already verified */}
                            {(order.stage === 'customer_dp_desain' || order.dp_desain_verified) && (
                                <div className="p-4 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">DP Desain</p>
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(order.dp_desain_amount)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getPaymentBadge(order.dp_desain_verified, order.dp_desain_amount)}
                                        {!order.dp_desain_verified && order.dp_desain_amount > 0 && (
                                            <button
                                                onClick={() => handleVerifyPayment('dp_desain')}
                                                disabled={loading}
                                                className="px-3 py-1 text-sm rounded-lg bg-emerald-500 text-slate-900 hover:bg-emerald-600 disabled:opacity-50"
                                            >
                                                Verify
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* DP Produksi - Show only at dp_produksi stage OR if already verified */}
                            {(order.stage === 'dp_produksi' || order.dp_produksi_verified) && (
                                <div className={`p-4 rounded-xl space-y-3 ${GATEKEEPER_STAGES.includes('dp_produksi') ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-50'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900">DP Produksi (50%)</p>
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
                                                        alert('Masukkan nominal DP Produksi')
                                                        return
                                                    }
                                                    setLoading(true)
                                                    const { error } = await supabase
                                                        .from('orders')
                                                        .update({
                                                            dp_produksi_amount: amount,
                                                            dp_produksi_verified: true,
                                                            dp_produksi_verified_at: new Date().toISOString()
                                                        })
                                                        .eq('id', order.id)
                                                    if (error) {
                                                        alert(`Gagal: ${error.message}`)
                                                    } else {
                                                        onClose()
                                                        router.refresh()
                                                    }
                                                    setLoading(false)
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
                                                        alert('Masukkan nominal Pelunasan')
                                                        return
                                                    }
                                                    setLoading(true)
                                                    const { error } = await supabase
                                                        .from('orders')
                                                        .update({
                                                            pelunasan_amount: amount,
                                                            pelunasan_verified: true,
                                                            pelunasan_verified_at: new Date().toISOString()
                                                        })
                                                        .eq('id', order.id)
                                                    if (error) {
                                                        alert(`Gagal: ${error.message}`)
                                                    } else {
                                                        onClose()
                                                        router.refresh()
                                                    }
                                                    setLoading(false)
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
                                    <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-white">
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
                                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-white">
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
                                                        alert(`Gagal upload: ${uploadError.message}`)
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
                                                        alert(`Gagal update: ${updateError.message}`)
                                                        return
                                                    }

                                                    setPaymentProofFile(null)
                                                    setPaymentProofPreview(null)
                                                    router.refresh()
                                                    alert('Bukti pembayaran berhasil diupload!')
                                                } catch (err: unknown) {
                                                    console.error('Upload error:', err)
                                                    const message = err instanceof Error ? err.message : 'Unknown error'
                                                    alert(`Gagal upload bukti pembayaran: ${message}`)
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
                                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-white">
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
                                                    alert(`Gagal upload: ${uploadError.message}`)
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
                                                    alert(`Gagal update: ${updateError.message}`)
                                                    return
                                                }

                                                // Don't close modal - let user click the move stage button
                                                router.refresh()
                                                alert('Desain berhasil diupload! Sekarang Anda bisa klik tombol "Pindah ke Proses Layout"')
                                            } catch (err) {
                                                console.error('Upload error:', err)
                                                alert('Gagal upload desain')
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
                                            } catch (err) {
                                                console.error('Toggle stage error:', err)
                                                alert('Gagal mengupdate status')
                                            } finally {
                                                setLoading(false)
                                            }
                                        }}
                                        disabled={loading}
                                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isReady
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            : 'bg-red-500 text-white hover:bg-red-600'
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
                </div>
            </div>
        </div >
    )
}

