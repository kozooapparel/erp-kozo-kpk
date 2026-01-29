'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generatePayroll, submitPayrollForApproval, approvePayroll } from './actions'
import { toast } from 'sonner'

interface PayrollPeriod {
    id: string
    period_name: string
    start_date: string
    end_date: string
    payment_date: string
    status: string
    generated_at: string
    approved_by: string | null
    approved_at: string | null
    payroll_entries: Array<{ count: number }>
}

export default function PayrollListClient({
    periods,
    isOwner
}: {
    periods: PayrollPeriod[]
    isOwner: boolean
}) {
    const router = useRouter()
    const [showGenerateForm, setShowGenerateForm] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const startDate = formData.get('start_date') as string
        const endDate = formData.get('end_date') as string

        const result = await generatePayroll(startDate, endDate)

        if (result.success) {
            toast.success('Payroll berhasil di-generate!')
            setShowGenerateForm(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal generate payroll')
        }

        setLoading(false)
    }

    const handleSubmit = async (periodId: string) => {
        if (!confirm('Submit payroll untuk approval owner?')) return

        const result = await submitPayrollForApproval(periodId)

        if (result.success) {
            toast.success('Payroll telah disubmit untuk approval!')
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal submit payroll')
        }
    }

    const handleApprove = async (periodId: string) => {
        if (!confirm('Approve payroll ini? Kasbon akan otomatis terpotong.')) return

        const result = await approvePayroll(periodId)

        if (result.success) {
            toast.success('Payroll telah diapprove!')
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal approve payroll')
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
            pending_approval: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Approval' },
            approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
            paid: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Paid' }
        }
        const badge = badges[status as keyof typeof badges] || badges.draft
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Payroll System</h1>
                            <p className="text-slate-500 mt-1">Kelola periode penggajian karyawan</p>
                        </div>
                        <button
                            onClick={() => setShowGenerateForm(!showGenerateForm)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Generate Payroll
                        </button>
                    </div>
                </div>

                {/* Generate Form */}
                {showGenerateForm && (
                    <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">Generate Payroll Baru</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Akhir</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Sistem akan menghitung gaji berdasarkan absensi, tunjangan, lembur, dan potongan kasbon untuk periode ini.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowGenerateForm(false)}
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Generate Payroll'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Periods List */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Daftar Periode Payroll</h2>

                    {periods.length > 0 ? (
                        <div className="space-y-3">
                            {periods.map(period => {
                                const employeeCount = period.payroll_entries?.[0]?.count || 0

                                return (
                                    <div
                                        key={period.id}
                                        className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-purple-300 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-slate-900">{period.period_name}</h3>
                                                    {getStatusBadge(period.status)}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Periode: {formatDate(period.start_date)} - {formatDate(period.end_date)} |
                                                    Pembayaran: {formatDate(period.payment_date)} |
                                                    Karyawan: {employeeCount}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/hr/payroll/${period.id}`}
                                                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                                                >
                                                    View Detail
                                                </Link>

                                                {period.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleSubmit(period.id)}
                                                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
                                                    >
                                                        Submit untuk Approval
                                                    </button>
                                                )}

                                                {period.status === 'pending_approval' && isOwner && (
                                                    <button
                                                        onClick={() => handleApprove(period.id)}
                                                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
                                                    >
                                                        Approve Payroll
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-500">Belum ada payroll</p>
                            <p className="text-sm text-slate-400 mt-1">Klik "Generate Payroll" untuk mulai</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
