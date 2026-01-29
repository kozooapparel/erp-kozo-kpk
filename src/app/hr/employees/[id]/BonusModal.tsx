'use client'

import { useState } from 'react'
import { addBonus, updateBonus, deleteBonus } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Bonus {
    id: string
    bonus_type: string
    amount: number
    period_month: number
    period_year: number
    reason: string | null
    status: string
}

interface BonusModalProps {
    employeeId: string
    bonus?: Bonus
    onClose: () => void
}

export default function BonusModal({ employeeId, bonus, onClose }: BonusModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const isEdit = !!bonus

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        const result = isEdit
            ? await updateBonus(bonus.id, employeeId, formData)
            : await addBonus(employeeId, formData)

        if (result.success) {
            toast.success(isEdit ? 'Bonus berhasil diupdate!' : 'Bonus berhasil ditambahkan!')
            onClose()
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal menyimpan bonus')
        }

        setLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm('Hapus bonus ini?')) return

        setLoading(true)
        const result = await deleteBonus(bonus!.id, employeeId)

        if (result.success) {
            toast.success('Bonus berhasil dihapus!')
            onClose()
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal menghapus bonus')
        }

        setLoading(false)
    }

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {isEdit ? 'Edit Bonus' : 'Tambah Bonus'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Jenis Bonus <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="bonus_type"
                            required
                            defaultValue={bonus?.bonus_type || ''}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                            <option value="">Pilih Jenis</option>
                            <option value="performance">Performa</option>
                            <option value="target">Target</option>
                            <option value="holiday">THR</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nominal (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="amount"
                            required
                            min="0"
                            step="10000"
                            defaultValue={bonus?.amount || ''}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                    </div>

                    {/* Period */}
                    {!isEdit && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Bulan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="period_month"
                                    required
                                    defaultValue={currentMonth}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tahun <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="period_year"
                                    required
                                    defaultValue={currentYear}
                                    min={currentYear - 1}
                                    max={currentYear + 1}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Keterangan
                        </label>
                        <textarea
                            name="reason"
                            rows={2}
                            defaultValue={bonus?.reason || ''}
                            placeholder="Bonus performa Q4, dll"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {isEdit && bonus?.status === 'pending' && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                Hapus
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
