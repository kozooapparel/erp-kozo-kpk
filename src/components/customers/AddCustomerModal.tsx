'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AddCustomerModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')

    const router = useRouter()
    const supabase = createClient()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !phone.trim()) {
            alert('Nama dan No. HP wajib diisi')
            return
        }

        setLoading(true)
        try {
            // Check if phone already exists
            const { data: existing } = await supabase
                .from('customers')
                .select('id, name')
                .eq('phone', phone.trim())
                .single()

            if (existing) {
                alert(`Customer dengan No. HP ini sudah terdaftar: ${existing.name}`)
                return
            }

            const { error } = await supabase
                .from('customers')
                .insert({
                    name: name.trim(),
                    phone: phone.trim(),
                })

            if (error) {
                console.error('Error:', error)
                alert(`Gagal menyimpan: ${error.message}`)
                return
            }

            // Reset form
            setName('')
            setPhone('')
            router.refresh()
            onClose()
            alert('Customer berhasil ditambahkan!')
        } catch (err) {
            console.error('Error:', err)
            alert('Terjadi kesalahan')
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
                    <h2 className="text-lg font-bold text-slate-900">Tambah Customer Baru</h2>
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nama Customer <span className="text-red-400">*</span>
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            No. HP <span className="text-red-400">*</span>
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

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-slate-200 text-slate-900 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

