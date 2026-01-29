import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

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

export default async function AttendanceDashboard() {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's attendance
    const { data: attendanceLogs, error } = await supabase
        .from('attendance_logs')
        .select(`
            *,
            employees (
                full_name,
                nik,
                department
            )
        `)
        .eq('date', today)
        .order('check_in', { ascending: true })

    if (error) {
        console.error('Error fetching attendance:', error)
    }

    // Fetch all active employees to check who hasn't checked in
    const { data: allEmployees } = await supabase
        .from('employees')
        .select('id, full_name, nik, department')
        .eq('status', 'active')

    const checkedInIds = new Set(attendanceLogs?.map(log => log.employee_id) || [])
    const notCheckedIn = allEmployees?.filter(emp => !checkedInIds.has(emp.id)) || []

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

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Absensi Real-Time</h1>
                    <p className="text-slate-500 mt-1">
                        {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-100">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Hadir</p>
                                <p className="text-2xl font-bold text-slate-900">{attendanceLogs?.length || 0}</p>
                            </div>
                        </div>
                    </div>
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
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-100">
                                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Kurang Jam</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {attendanceLogs?.filter(log => log.deficit_hours > 0).length || 0}
                                </p>
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
                                <p className="text-2xl font-bold text-slate-900">
                                    {attendanceLogs?.filter(log => log.forgot_checkout).length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance List */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Daftar Absensi Hari Ini</h2>

                    {attendanceLogs && attendanceLogs.length > 0 ? (
                        <div className="space-y-2">
                            {attendanceLogs.map((log: AttendanceLog) => {
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
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-sm font-bold text-white">
                                                    {log.employees?.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{log.employees?.full_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {log.employees?.nik} • {log.employees?.department}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
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
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Belum ada absensi hari ini</p>
                        </div>
                    )}
                </div>

                {/* Not Checked In */}
                {notCheckedIn.length > 0 && (
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
        </DashboardLayout>
    )
}
