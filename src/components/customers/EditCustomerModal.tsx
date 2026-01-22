'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Customer {
    id: string
    name: string
    phone: string
    alamat?: string | null
}

interface EditCustomerModalProps {
    customer: Customer | null
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function EditCustomerModal({ customer, isOpen, onClose, onSuccess }: EditCustomerModalProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [alamat, setAlamat] = useState('')

    const router = useRouter()
    const supabase = createClient()

    // Populate form when customer changes
    useEffect(() => {
        if (customer) {
            setName(customer.name || '')
            setPhone(customer.phone || '')
            setAlamat(customer.alamat || '')
        }
    }, [customer])

    if (!isOpen || !customer) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !phone.trim()) {
            toast.warning('Nama dan No. HP wajib diisi')
            return
        }

        setLoading(true)
        try {
            // Check if phone already exists (exclude current customer)
            const { data: existing } = await supabase
                .from('customers')
                .select('id, name')
                .eq('phone', phone.trim())
                .neq('id', customer.id)
                .single()

            if (existing) {
                toast.warning(`No. HP ini sudah digunakan customer lain: ${existing.name}`)
                setLoading(false)
                return
            }

            const { error } = await supabase
                .from('customers')
                .update({
                    name: name.trim(),
                    phone: phone.trim(),
                    alamat: alamat.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', customer.id)

            if (error) {
                console.error('Error:', error)
                toast.error(`Gagal menyimpan: ${error.message}`)
                return
            }

            router.refresh()
            onSuccess?.()
            onClose()
            toast.success('Data customer berhasil diperbarui!')
        } catch (err) {
            console.error('Error:', err)
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Edit Customer</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nama Customer <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: PT Maju Jaya"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            No. HP <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Gunakan format tanpa spasi atau tanda hubung</p>
                    </div>

                    {/* Alamat */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Alamat Lengkap
                        </label>
                        <textarea
                            value={alamat}
                            onChange={(e) => setAlamat(e.target.value)}
                            placeholder="Contoh: Jl. Raya No. 123, Kec. Sukasari"
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-slate-200 text-slate-900 font-medium hover:bg-slate-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
