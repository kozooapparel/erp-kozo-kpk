'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEmployee } from '../actions'
import { toast } from 'sonner'

export default function AddEmployeePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await createEmployee(formData)

        if (result.success) {
            toast.success('Karyawan berhasil ditambahkan!')
            router.push('/hr/employees')
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal menambahkan karyawan')
        }

        setLoading(false)
    }

    return (
        <div className="space-y-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tambah Karyawan Baru</h1>
                    <p className="text-slate-500 mt-1">Isi data karyawan untuk sistem absensi dan penggajian</p>
                </div>

                {/* NIK */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        NIK (Nomor Induk Karyawan) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nik"
                        required
                        placeholder="EMP001"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">NIK akan digunakan untuk mapping fingerprint</p>
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
                        placeholder="Budi Santoso"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
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
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    >
                        <option value="">Pilih Departemen</option>
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
                        placeholder="Operator Jahit"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
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
                        placeholder="150000"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Gaji per hari kerja (bukan bulanan)</p>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                </div>

                {/* Bank Account */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nomor Rekening Bank (Opsional)
                    </label>
                    <input
                        type="text"
                        name="bank_account"
                        placeholder="1234567890 (BCA)"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Untuk slip gaji</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={loading}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Simpan Karyawan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
