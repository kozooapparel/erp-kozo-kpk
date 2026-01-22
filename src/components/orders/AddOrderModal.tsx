'use client'

import { useState, useEffect } from 'react'
import { Customer, OrderInsert, Brand } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NumberInput from '@/components/ui/NumberInput'
import CurrencyInput from '@/components/ui/CurrencyInput'

interface AddOrderModalProps {
    isOpen: boolean
    onClose: () => void
    customers: Customer[]
}

export default function AddOrderModal({ isOpen, onClose, customers }: AddOrderModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [brands, setBrands] = useState<Brand[]>([])

    // Form state
    const [brandId, setBrandId] = useState('')
    const [customerId, setCustomerId] = useState('')

    const router = useRouter()
    const supabase = createClient()

    // Fetch brands on mount
    useEffect(() => {
        const fetchBrands = async () => {
            const { data } = await supabase
                .from('brands')
                .select('*')
                .eq('is_active', true)
                .order('is_default', { ascending: false })
                .order('name')

            if (data) {
                setBrands(data)
                // Auto-select default brand
                const defaultBrand = data.find(b => b.is_default)
                if (defaultBrand) {
                    setBrandId(defaultBrand.id)
                }
            }
        }

        if (isOpen) {
            fetchBrands()
        }
    }, [isOpen, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            // Create order with brand (quantity will be updated when size_breakdown is set)
            const orderData: OrderInsert = {
                customer_id: customerId,
                total_quantity: 0,  // Will be calculated from size_breakdown later
                dp_desain_amount: 0,
                dp_desain_verified: false,
                stage: 'customer_dp_desain',
                created_by: user?.id || null,
                brand_id: brandId || null,
            }

            const { error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single()

            if (orderError) throw orderError

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
        setError(null)
        // Keep brand selection for convenience
    }

    if (!isOpen) return null

    const selectedBrand = brands.find(b => b.id === brandId)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl m-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
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
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Brand Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Brand *
                        </label>
                        <div className="flex gap-2">
                            {brands.map((brand) => (
                                <button
                                    key={brand.id}
                                    type="button"
                                    onClick={() => setBrandId(brand.id)}
                                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${brandId === brand.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {brand.logo_url ? (
                                        <img
                                            src={brand.logo_url}
                                            alt={brand.name}
                                            className="w-6 h-6 object-contain"
                                        />
                                    ) : (
                                        <span className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {brand.code}
                                        </span>
                                    )}
                                    <span className={`text-sm font-medium ${brandId === brand.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {brand.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {selectedBrand && (
                            <p className="text-xs text-slate-400 mt-2">
                                Invoice prefix: <span className="font-medium">{selectedBrand.invoice_prefix}</span>
                            </p>
                        )}
                    </div>

                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Customer *
                        </label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="">Pilih Customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} - {c.phone}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">
                            Tambah customer baru di menu <span className="font-medium">Customers</span>
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !brandId}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <span className="inline-flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
