'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveBonus } from '../employees/actions'
import { toast } from 'sonner'

interface Bonus {
    id: string
    bonus_type: string
    amount: number
    period_month: number
    period_year: number
    reason: string | null
    status: string
    created_at: string
    employee: {
        full_name: string
        nik: string
        department: string
    }
    creator: {
        full_name: string
    }
}

export default function BonusApprovalClient({ bonuses }: { bonuses: Bonus[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState('')

    const handleApprove = async (bonusId: string) => {
        if (!confirm('Approve bonus ini? Akan otomatis masuk ke payroll periode terkait.')) return

        setLoading(bonusId)
        const result = await approveBonus(bonusId)

        if (result.success) {
            toast.success('Bonus telah diapprove!')
            router.refresh()
        } else {
            toast.error(result.error || 'Gagal approve bonus')
        }

        setLoading('')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatPeriod = (month: number, year: number) => {
        return new Date(year, month - 1).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric'
        })
    }

    const pendingBonuses = bonuses.filter(b => b.status === 'pending')
    const approvedBonuses = bonuses.filter(b => b.status === 'approved')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Approval Bonus Karyawan</h1>
                <p className="text-slate-500 mt-1">Review dan approve bonus yang diajukan admin</p>
            </div>

            {/* Pending Bonuses */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Menunggu Approval ({pendingBonuses.length})
                </h2>

                {pendingBonuses.length > 0 ? (
                    <div className="space-y-3">
                        {pendingBonuses.map(bonus => (
                            <div key={bonus.id} className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {bonus.employee.full_name}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-xs font-medium text-slate-600">
                                                {bonus.employee.nik}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3">
                                            {bonus.employee.department} · Dibuat oleh {bonus.creator.full_name}
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500">Jenis</p>
                                                <p className="font-medium text-slate-900 capitalize">{bonus.bonus_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Nominal</p>
                                                <p className="font-bold text-purple-600">{formatCurrency(bonus.amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Periode</p>
                                                <p className="font-medium text-slate-900">{formatPeriod(bonus.period_month, bonus.period_year)}</p>
                                            </div>
                                        </div>
                                        {bonus.reason && (
                                            <div className="mt-3 p-2 rounded-lg bg-white/60">
                                                <p className="text-xs text-slate-500">Keterangan:</p>
                                                <p className="text-sm text-slate-700">{bonus.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleApprove(bonus.id)}
                                        disabled={loading === bonus.id}
                                        className="ml-4 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {loading === bonus.id ? 'Approving...' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-500">Tidak ada bonus pending</p>
                    </div>
                )}
            </div>

            {/* Approved Bonuses */}
            {approvedBonuses.length > 0 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Riwayat Approved ({approvedBonuses.length})
                    </h2>
                    <div className="space-y-2">
                        {approvedBonuses.map(bonus => (
                            <div key={bonus.id} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">{bonus.employee.full_name}</p>
                                        <p className="text-sm text-slate-600">
                                            {formatCurrency(bonus.amount)} • {formatPeriod(bonus.period_month, bonus.period_year)}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-800 text-xs font-medium">
                                        ✅ Approved
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
