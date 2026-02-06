'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface AttendanceLog {
    id: string
    employee_id: string
    date: string
    check_in: string | null
    check_out: string | null
    effective_hours: number | null
    deficit_hours: number
    forgot_checkout: boolean
    status: string
    employees: {
        full_name: string
        nik: string
        department: string
    }
}

interface AttendanceClientProps {
    attendanceLogs: AttendanceLog[]
    notCheckedIn: { id: string; full_name: string; nik: string; department: string }[]
    startDate: string
    endDate: string
    allEmployeesCount: number
}

export default function AttendanceClient({
    attendanceLogs,
    notCheckedIn,
    startDate,
    endDate,
    allEmployeesCount
}: AttendanceClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return '-'
        return new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatHours = (hours: number | null) => {
        if (hours === null) return '-'
        return `${hours.toFixed(2)} jam`
    }

    const setDateRange = useCallback((from: string, to: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('from', from)
        params.set('to', to)
        router.push(`/hr/attendance?${params.toString()}`)
    }, [router, searchParams])

    const handleQuickFilter = (filter: 'today' | '7days' | 'month') => {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        if (filter === 'today') {
            setDateRange(todayStr, todayStr)
        } else if (filter === '7days') {
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 6)
            setDateRange(weekAgo.toISOString().split('T')[0], todayStr)
        } else if (filter === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
            setDateRange(firstDay.toISOString().split('T')[0], todayStr)
        }
    }

    const isActiveFilter = (filter: 'today' | '7days' | 'month') => {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        if (filter === 'today') {
            return startDate === todayStr && endDate === todayStr
        } else if (filter === '7days') {
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 6)
            return startDate === weekAgo.toISOString().split('T')[0] && endDate === todayStr
        } else if (filter === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
            return startDate === firstDay.toISOString().split('T')[0] && endDate === todayStr
        }
        return false
    }

    // Group logs by date
    const groupedLogs = attendanceLogs.reduce((acc, log) => {
        if (!acc[log.date]) {
            acc[log.date] = []
        }
        acc[log.date].push(log)
        return acc
    }, {} as Record<string, AttendanceLog[]>)

    // Sort dates descending (newest first)
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a))

    // Calculate stats
    const totalPresent = attendanceLogs.length
    const uniqueDays = sortedDates.length
    const totalDeficit = attendanceLogs.filter(log => log.deficit_hours > 0).length
    const totalForgotCheckout = attendanceLogs.filter(log => log.forgot_checkout).length

    const formatDateHeader = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const isSingleDay = startDate === endDate

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Absensi Karyawan</h1>
                <p className="text-slate-500 mt-1">
                    {isSingleDay
                        ? formatDateHeader(startDate)
                        : `${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    }
                </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => handleQuickFilter('today')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActiveFilter('today')
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        Hari Ini
                    </button>
                    <button
                        onClick={() => handleQuickFilter('7days')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActiveFilter('7days')
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        7 Hari
                    </button>
                    <button
                        onClick={() => handleQuickFilter('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActiveFilter('month')
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        Bulan Ini
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-300 hidden sm:block" />

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setDateRange(e.target.value, endDate)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-slate-400">→</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setDateRange(startDate, e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-emerald-100">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{isSingleDay ? 'Hadir' : 'Total Hadir'}</p>
                            <p className="text-2xl font-bold text-slate-900">{totalPresent}</p>
                            {!isSingleDay && <p className="text-xs text-slate-400">{uniqueDays} hari</p>}
                        </div>
                    </div>
                </div>
                {isSingleDay && (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-red-100">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Belum Masuk</p>
                                <p className="text-2xl font-bold text-slate-900">{notCheckedIn.length}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-amber-100">
                            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Kurang Jam</p>
                            <p className="text-2xl font-bold text-slate-900">{totalDeficit}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Lupa Checkout</p>
                            <p className="text-2xl font-bold text-slate-900">{totalForgotCheckout}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance List by Date */}
            {sortedDates.length > 0 ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-xl">📅</span>
                                {formatDateHeader(date)}
                                <span className="ml-auto text-sm font-normal text-slate-500">
                                    {groupedLogs[date].length} karyawan
                                </span>
                            </h2>

                            <div className="space-y-2">
                                {groupedLogs[date].map((log: AttendanceLog) => {
                                    const isComplete = log.check_out !== null
                                    const hasDeficit = log.deficit_hours > 0
                                    const forgotCheckout = log.forgot_checkout

                                    return (
                                        <div
                                            key={log.id}
                                            className={`p-4 rounded-xl border-2 ${hasDeficit
                                                ? 'bg-amber-50 border-amber-200'
                                                : forgotCheckout
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : isComplete
                                                        ? 'bg-emerald-50 border-emerald-200'
                                                        : 'bg-slate-50 border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-sm font-bold text-white">
                                                        {log.employees?.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{log.employees?.full_name}</p>
                                                        <p className="text-sm text-slate-500">
                                                            {log.employees?.nik} • {log.employees?.department}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 flex-wrap">
                                                    <div className="text-center">
                                                        <p className="text-xs text-slate-500">Masuk</p>
                                                        <p className="text-sm font-semibold text-slate-900">{formatTime(log.check_in)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-slate-500">Pulang</p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {isComplete ? formatTime(log.check_out) : '🟡 Belum'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-slate-500">Jam Efektif</p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {formatHours(log.effective_hours)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        {hasDeficit && (
                                                            <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-800 text-xs font-medium">
                                                                ⚠️ Kurang {formatHours(log.deficit_hours)}
                                                            </span>
                                                        )}
                                                        {forgotCheckout && (
                                                            <span className="px-3 py-1 rounded-full bg-blue-200 text-blue-800 text-xs font-medium">
                                                                🤖 Auto-Close
                                                            </span>
                                                        )}
                                                        {isComplete && !hasDeficit && !forgotCheckout && (
                                                            <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-800 text-xs font-medium">
                                                                ✅ OK
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                    <p className="text-slate-500">Tidak ada data absensi untuk periode ini</p>
                </div>
            )}

            {/* Not Checked In (only show for single day) */}
            {isSingleDay && notCheckedIn.length > 0 && (
                <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-red-900 mb-4">
                        ❌ Belum Absen ({notCheckedIn.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {notCheckedIn.map(emp => (
                            <div key={emp.id} className="p-3 rounded-lg bg-white border border-red-200">
                                <p className="font-medium text-slate-900">{emp.full_name}</p>
                                <p className="text-sm text-slate-500">{emp.department}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
