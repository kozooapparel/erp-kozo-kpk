'use client'

import { useState } from 'react'
import { Customer, OrderInsert } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AddOrderModalProps {
    isOpen: boolean
    onClose: () => void
    customers: Customer[]
}

export default function AddOrderModal({ isOpen, onClose, customers }: AddOrderModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showNewCustomer, setShowNewCustomer] = useState(false)
    const [mockupFile, setMockupFile] = useState<File | null>(null)
    const [mockupPreview, setMockupPreview] = useState<string | null>(null)

    // Form state
    const [customerId, setCustomerId] = useState('')
    const [newCustomerName, setNewCustomerName] = useState('')
    const [newCustomerPhone, setNewCustomerPhone] = useState('')
    const [totalQuantity, setTotalQuantity] = useState('')
    const [orderDescription, setOrderDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [dpDesainAmount, setDpDesainAmount] = useState('')

    const router = useRouter()
    const supabase = createClient()

    const handleMockupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setMockupFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setMockupPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const uploadMockup = async (orderId: string): Promise<string | null> => {
        if (!mockupFile) return null

        const fileExt = mockupFile.name.split('.').pop()
        const fileName = `${orderId}.${fileExt}`
        const filePath = `mockups/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('order-assets')
            .upload(filePath, mockupFile)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return null
        }

        const { data: { publicUrl } } = supabase.storage
            .from('order-assets')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            let finalCustomerId = customerId

            // Create new customer if needed
            if (showNewCustomer) {
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({ name: newCustomerName, phone: newCustomerPhone })
                    .select()
                    .single()

                if (customerError) throw customerError
                finalCustomerId = newCustomer.id
            }

            // Create order with created_by
            const orderData: OrderInsert = {
                customer_id: finalCustomerId,
                total_quantity: parseInt(totalQuantity),
                order_description: orderDescription || null,
                deadline: deadline || null,
                dp_desain_amount: dpDesainAmount ? parseFloat(dpDesainAmount) : 0,
                dp_desain_verified: dpDesainAmount ? true : false,
                stage: 'customer_dp_desain',
                created_by: user?.id || null, // Track who created this order
            }

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single()

            if (orderError) throw orderError

            // Upload mockup if exists
            if (mockupFile && order) {
                const mockupUrl = await uploadMockup(order.id)
                if (mockupUrl) {
                    await supabase
                        .from('orders')
                        .update({ mockup_url: mockupUrl })
                        .eq('id', order.id)
                }
            }

            // Reset form and close
            resetForm()
            onClose()
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setCustomerId('')
        setNewCustomerName('')
        setNewCustomerPhone('')
        setTotalQuantity('')
        setOrderDescription('')
        setDeadline('')
        setDpDesainAmount('')
        setMockupFile(null)
        setMockupPreview(null)
        setShowNewCustomer(false)
        setError(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl m-4">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Tambah Order Baru</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Customer
                        </label>
                        {!showNewCustomer ? (
                            <div className="space-y-2">
                                <select
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    required={!showNewCustomer}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="">Pilih Customer</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} - {c.phone}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewCustomer(true)}
                                    className="text-sm text-emerald-400 hover:text-emerald-300"
                                >
                                    + Tambah Customer Baru
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-300">
                                <input
                                    type="text"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    placeholder="Nama Customer"
                                    required={showNewCustomer}
                                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <input
                                    type="tel"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    placeholder="No. HP (08xxx)"
                                    required={showNewCustomer}
                                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewCustomer(false)}
                                    className="text-sm text-slate-500 hover:text-slate-900"
                                >
                                    ← Pilih dari daftar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Jumlah (pcs) *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={totalQuantity}
                            onChange={(e) => setTotalQuantity(e.target.value)}
                            required
                            placeholder="50"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Deskripsi Order
                        </label>
                        <textarea
                            value={orderDescription}
                            onChange={(e) => setOrderDescription(e.target.value)}
                            placeholder="Jersey Tim Futsal warna merah-hitam, logo depan dada kiri..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Deadline
                        </label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* DP Desain */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            DP Desain (Rp)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={dpDesainAmount}
                            onChange={(e) => setDpDesainAmount(e.target.value)}
                            placeholder="500000"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* Mockup Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Upload Mockup
                        </label>
                        <div className="relative">
                            {mockupPreview ? (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-100">
                                    <img
                                        src={mockupPreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMockupFile(null)
                                            setMockupPreview(null)
                                        }}
                                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-slate-900 hover:bg-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-600 hover:border-emerald-500/50 bg-slate-50 cursor-pointer transition-colors">
                                    <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-slate-500">Klik untuk upload gambar</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMockupChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <span className="inline-flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Menyimpan...
                            </span>
                        ) : (
                            'Simpan Order'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

