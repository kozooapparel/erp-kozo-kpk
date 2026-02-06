'use client'

import { useState, useMemo } from 'react'
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
    total_gross?: number
    total_net?: number
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
    const [selectedYear, setSelectedYear] = useState<string>('all')

    // Get unique years from periods
    const availableYears = useMemo(() => {
        const years = new Set<number>()
        periods.forEach(p => {
            years.add(new Date(p.start_date).getFullYear())
        })
        return Array.from(years).sort((a, b) => b - a)
    }, [periods])

    // Filter periods by year
    const filteredPeriods = useMemo(() => {
        if (selectedYear === 'all') return periods
        return periods.filter(p =>
            new Date(p.start_date).getFullYear() === parseInt(selectedYear)
        )
    }, [periods, selectedYear])

    // Calculate summary stats for current month
    const currentMonthStats = useMemo(() => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const currentPeriods = periods.filter(p => {
            const date = new Date(p.start_date)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
        })

        const totalPeriods = currentPeriods.length
        const approvedCount = currentPeriods.filter(p => p.status === 'approved' || p.status === 'paid').length
        const pendingCount = currentPeriods.filter(p => p.status === 'pending_approval').length
        const draftCount = currentPeriods.filter(p => p.status === 'draft').length

        return { totalPeriods, approvedCount, pendingCount, draftCount }
    }, [periods])

    // Quick generate current month
    const handleQuickGenerate = async () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()

        // First day of current month
        const startDate = new Date(year, month, 1).toISOString().split('T')[0]
        // Last day of current month
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

        setLoading(true)
        const result = await generatePayroll(startDate, endDate)

        if (result.success) {
            toast.success('Payroll bulan ini berhasil di-generate!')
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal generate payroll')
        }
        setLoading(false)
    }

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

    const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

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
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Payroll System</h1>
                            <p className="text-slate-500 mt-1">Kelola periode penggajian karyawan</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleQuickGenerate}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Bulan Ini
                            </button>
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
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Periode</p>
                                <p className="text-2xl font-bold text-slate-900">{periods.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-100">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Approved</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {periods.filter(p => p.status === 'approved' || p.status === 'paid').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-100">
                                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {periods.filter(p => p.status === 'pending_approval').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-slate-100">
                                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Draft</p>
                                <p className="text-2xl font-bold text-slate-600">
                                    {periods.filter(p => p.status === 'draft').length}
                                </p>
                            </div>
                        </div>
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-900">Daftar Periode Payroll</h2>

                        {/* Year Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-500">Tahun:</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Semua</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filteredPeriods.length > 0 ? (
                        <div className="space-y-3">
                            {filteredPeriods.map(period => {
                                const employeeCount = period.payroll_entries?.[0]?.count || 0

                                return (
                                    <div
                                        key={period.id}
                                        className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-purple-300 transition-all"
                                    >
                                        <div className="flex items-center justify-between flex-wrap gap-4">
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
