'use client'

import { useState } from 'react'
import { updateAllowance } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Allowance {
    id: string
    allowance_type: string
    amount: number
    calculation_method: string
}

interface EditAllowanceModalProps {
    allowance: Allowance
    employeeId: string
    onClose: () => void
}

export default function EditAllowanceModal({ allowance, employeeId, onClose }: EditAllowanceModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await updateAllowance(allowance.id, employeeId, formData)

        if (result.success) {
            toast.success('Tunjangan berhasil diupdate!')
            onClose()
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal update tunjangan')
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Edit Tunjangan</h2>
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
                            Jenis Tunjangan <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="type"
                            required
                            defaultValue={allowance.allowance_type}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="transport">Transport</option>
                            <option value="meal">Makan</option>
                            <option value="position">Jabatan</option>
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
                            step="1000"
                            defaultValue={allowance.amount}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>

                    {/* Calculation Method */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Metode Hitung <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="calculation_method"
                            required
                            defaultValue={allowance.calculation_method}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="per_day">Per Hari</option>
                            <option value="per_month">Per Bulan</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
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
                            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
