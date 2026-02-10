'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Modal, ModalFooter } from '@/components/ui'

interface AddCustomerModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [alamat, setAlamat] = useState('')

    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !phone.trim()) {
            toast.warning('Nama dan No. HP wajib diisi')
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
                toast.warning(`Customer dengan No. HP ini sudah terdaftar: ${existing.name}`)
                return
            }

            const { error } = await supabase
                .from('customers')
                .insert({
                    name: name.trim(),
                    phone: phone.trim(),
                    alamat: alamat.trim() || null,
                })

            if (error) {
                console.error('Error:', error)
                toast.error(`Gagal menyimpan: ${error.message}`)
                return
            }

            // Reset form
            setName('')
            setPhone('')
            setAlamat('')
            router.refresh()
            onClose()
            toast.success('Customer berhasil ditambahkan!')
        } catch (err) {
            console.error('Error:', err)
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Customer Baru">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nama Customer <span className="text-red-400">*</span>
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
                        No. HP <span className="text-red-400">*</span>
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
                        placeholder="Jl. Raya No. 123, Kota Bandung"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-subtle focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    loading={loading}
                    submitText="Simpan"
                    variant="primary"
                />
            </form>
        </Modal>
    )
}
