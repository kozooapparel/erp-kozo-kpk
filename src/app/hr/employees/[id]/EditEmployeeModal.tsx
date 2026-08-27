'use client'

import { useState } from 'react'
import { updateEmployee } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Employee {
    id: string
    nik: string
    full_name: string
    department: string
    position: string
    daily_rate: number
    join_date: string
    bank_account: string | null
    status: string
}

interface EditEmployeeModalProps {
    employee: Employee
    onClose: () => void
}

export default function EditEmployeeModal({ employee, onClose }: EditEmployeeModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await updateEmployee(employee.id, formData)

        if (result.success) {
            toast.success('Data karyawan berhasil diupdate!')
            onClose()
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal update karyawan')
        }

        setLoading(false)
    }

    const handleDeactivate = async () => {
        if (!confirm('Nonaktifkan karyawan ini? Mereka tidak akan muncul di payroll.')) return

        setLoading(true)
        const formData = new FormData()
        formData.set('full_name', employee.full_name)
        formData.set('department', employee.department)
        formData.set('position', employee.position)
        formData.set('daily_rate', employee.daily_rate.toString())
        formData.set('join_date', employee.join_date)
        formData.set('bank_account', employee.bank_account || '')
        formData.set('status', 'inactive')

        const result = await updateEmployee(employee.id, formData)

        if (result.success) {
            toast.success('Karyawan telah dinonaktifkan!')
            onClose()
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal nonaktifkan karyawan')
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Edit Data Karyawan</h2>
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
                    {/* NIK (readonly) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            NIK (Tidak bisa diubah)
                        </label>
                        <input
                            type="text"
                            value={employee.nik}
                            disabled
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">NIK terhubung dengan fingerprint, tidak bisa diubah</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            required
                            defaultValue={employee.full_name}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Departemen <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="department"
                            required
                            defaultValue={employee.department}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                        >
                            <option value="Produksi">Produksi</option>
                            <option value="QC">QC</option>
                            <option value="Packing">Packing</option>
                            <option value="Admin">Admin</option>
                            <option value="Sales">Sales</option>
                        </select>
                    </div>

                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Posisi/Jabatan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="position"
                            required
                            defaultValue={employee.position}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                        />
                    </div>

                    {/* Daily Rate */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Gaji Harian (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="daily_rate"
                            required
                            min="0"
                            step="1000"
                            defaultValue={employee.daily_rate}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                        />
                    </div>

                    {/* Join Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tanggal Bergabung <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="join_date"
                            required
                            defaultValue={employee.join_date}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                        />
                    </div>

                    {/* Bank Account */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nomor Rekening Bank
                        </label>
                        <input
                            type="text"
                            name="bank_account"
                            defaultValue={employee.bank_account || ''}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                        />
                    </div>

                    {/* Status */}
                    <input type="hidden" name="status" value={employee.status} />

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        {employee.status === 'active' && (
                            <button
                                type="button"
                                onClick={handleDeactivate}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                Nonaktifkan Karyawan
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
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
