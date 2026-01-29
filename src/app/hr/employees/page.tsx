import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Employee {
    id: string
    nik: string
    full_name: string
    department: string
    position: string
    daily_rate: number
    join_date: string
    status: string
    created_at: string
}

export default async function EmployeesPage() {
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

    // Fetch employees
    const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching employees:', error)
    }

    const activeEmployees = employees?.filter(e => e.status === 'active') || []
    const inactiveEmployees = employees?.filter(e => e.status === 'inactive') || []

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Kelola Karyawan</h1>
                        <p className="text-slate-500 mt-1">Manage employee data, salary & allowances</p>
                    </div>
                    <Link
                        href="/hr/employees/add"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Tambah Karyawan
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-100">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Karyawan Aktif</p>
                                <p className="text-2xl font-bold text-slate-900">{activeEmployees.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-100">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Payroll/Bulan (Est.)</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(activeEmployees.reduce((sum, e) => sum + (e.daily_rate * 26), 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-100">
                                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Karyawan Inactive</p>
                                <p className="text-2xl font-bold text-slate-900">{inactiveEmployees.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee List */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Daftar Karyawan</h2>

                    {activeEmployees.length > 0 ? (
                        <div className="space-y-3">
                            {activeEmployees.map((employee: Employee) => (
                                <Link
                                    key={employee.id}
                                    href={`/hr/employees/${employee.id}`}
                                    className="block p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                                                {employee.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                                                        {employee.full_name}
                                                    </p>
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-xs font-medium text-slate-600">
                                                        {employee.nik}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {employee.position} • {employee.department}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Bergabung {formatDate(employee.join_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">Gaji Harian</p>
                                            <p className="text-lg font-bold text-slate-900">
                                                {formatCurrency(employee.daily_rate)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-slate-500">Belum ada karyawan</p>
                            <p className="text-sm text-slate-400 mt-1">Klik "Tambah Karyawan" untuk mulai</p>
                        </div>
                    )}
                </div>

                {/* Inactive Employees */}
                {inactiveEmployees.length > 0 && (
                    <details className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <summary className="text-lg font-semibold text-slate-700 cursor-pointer">
                            Karyawan Inactive ({inactiveEmployees.length})
                        </summary>
                        <div className="mt-4 space-y-2">
                            {inactiveEmployees.map((employee: Employee) => (
                                <div key={employee.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 opacity-60">
                                    <p className="font-medium text-slate-700">{employee.full_name}</p>
                                    <p className="text-sm text-slate-500">{employee.nik} • {employee.position}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </DashboardLayout>
    )
}
