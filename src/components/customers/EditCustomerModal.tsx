'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Modal, ModalFooter } from '@/components/ui'

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

    if (!customer) return null

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
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Customer">
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
                        placeholder="PT Maju Jaya"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-subtle focus:outline-none focus:border-emerald-500 transition-colors"
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
                        placeholder="081234567890"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-subtle focus:outline-none focus:border-emerald-500 transition-colors"
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
                        placeholder="Jl. Raya No. 123, Sukasari"
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-subtle focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    loading={loading}
                    submitText="Simpan Perubahan"
                    variant="primary"
                />
            </form>
        </Modal>
    )
}
