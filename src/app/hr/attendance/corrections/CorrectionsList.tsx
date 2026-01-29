'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAttendance, deleteAttendance } from '../actions'
import { toast } from 'sonner'

interface AttendanceLog {
    id: string
    employee_id: string
    date: string
    check_in: string
    check_out: string | null
    effective_hours: number | null
    overtime_hours: number
    overtime_type: string | null
    deficit_hours: number
    forgot_checkout: boolean
    employee: {
        full_name: string
        nik: string
        department: string
    }
}

export default function CorrectionsList({ logs }: { logs: AttendanceLog[] }) {
    const router = useRouter()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleEdit = (logId: string) => {
        setEditingId(logId)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>, logId: string) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await updateAttendance(logId, formData)

        if (result.success) {
            toast.success('Absensi berhasil dikoreksi!')
            setEditingId(null)
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal update absensi')
        }

        setLoading(false)
    }

    const handleDelete = async (logId: string) => {
        if (!confirm('Hapus record absensi ini? Tidak bisa dibatalkan!')) return

        setLoading(true)
        const result = await deleteAttendance(logId)

        if (result.success) {
            toast.success('Absensi berhasil dihapus!')
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal hapus absensi')
        }

        setLoading(false)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return '-'
        return new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Koreksi Absensi</h1>
                <p className="text-slate-500 mt-1">Edit atau hapus record absensi (Owner only)</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Record Absensi (30 Hari Terakhir)
                </h2>

                {logs.length > 0 ? (
                    <div className="space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                {editingId === log.id ? (
                                    <form onSubmit={(e) => handleSave(e, log.id)} className="space-y-3">
                                        <div className="grid grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-xs text-slate-600 mb-1">Check In</label>
                                                <input
                                                    type="datetime-local"
                                                    name="check_in"
                                                    required
                                                    defaultValue={log.check_in.slice(0, 16)}
                                                    className="w-full px-2 py-1 text-sm rounded border border-slate-300 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-600 mb-1">Check Out</label>
                                                <input
                                                    type="datetime-local"
                                                    name="check_out"
                                                    defaultValue={log.check_out?.slice(0, 16) || ''}
                                                    className="w-full px-2 py-1 text-sm rounded border border-slate-300 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-600 mb-1">Overtime Type</label>
                                                <select
                                                    name="overtime_type"
                                                    defaultValue={log.overtime_type || ''}
                                                    className="w-full px-2 py-1 text-sm rounded border border-slate-300 focus:border-blue-500 outline-none"
                                                >
                                                    <option value="">Normal</option>
                                                    <option value="weekday">Weekday OT</option>
                                                    <option value="holiday">Holiday</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingId(null)}
                                                    disabled={loading}
                                                    className="px-3 py-1 text-sm rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 grid grid-cols-5 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500">Karyawan</p>
                                                <p className="font-medium text-slate-900">{log.employee.full_name}</p>
                                                <p className="text-xs text-slate-500">{log.employee.nik}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Tanggal</p>
                                                <p className="font-medium text-slate-900">{formatDate(log.date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Jam Masuk</p>
                                                <p className="font-medium text-slate-900">{formatTime(log.check_in)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Jam Pulang</p>
                                                <p className="font-medium text-slate-900">{formatTime(log.check_out)}</p>
                                                {log.forgot_checkout && (
                                                    <span className="text-xs text-blue-600">🤖 Auto</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Efektif / Lembur</p>
                                                <p className="font-medium text-slate-900">
                                                    {log.effective_hours?.toFixed(1) || '-'} / {log.overtime_hours.toFixed(1)}
                                                </p>
                                                {log.deficit_hours > 0 && (
                                                    <span className="text-xs text-amber-600">⚠️ -{log.deficit_hours.toFixed(1)}h</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(log.id)}
                                                className="p-2 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="p-2 rounded hover:bg-red-50 text-red-600 transition-colors"
                                                title="Hapus"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Tidak ada record absensi</p>
                    </div>
                )}
            </div>
        </div>
    )
}
