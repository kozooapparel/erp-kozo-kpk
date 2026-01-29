import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()

    // Await params (Next.js 15 requirement)
    const { id } = await params
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

    // Fetch payroll period with entries
    const { data: period, error } = await supabase
        .from('payroll_periods')
        .select(`
            *,
            payroll_entries (
                *,
                employees (
                    nik,
                    full_name,
                    department,
                    position
                )
            )
        `)
        .eq('id', id)
        .single()

    if (error || !period) {
        notFound()
    }

    const isOwner = profile?.role === 'owner'

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
            month: 'long',
            year: 'numeric'
        })
    }

    const totalGross = period.payroll_entries?.reduce((sum: number, entry: any) => sum + entry.gross_salary, 0) || 0
    const totalDeductions = period.payroll_entries?.reduce((sum: number, entry: any) => sum + entry.total_deductions, 0) || 0
    const totalNet = period.payroll_entries?.reduce((sum: number, entry: any) => sum + entry.net_salary, 0) || 0

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
            pending_approval: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Approval' },
            approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
            paid: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Paid' }
        }
        const badge = badges[status] || badges.draft
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        )
    }

    return (
        <DashboardLayout user={profile}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-slate-900">{period.period_name}</h1>
                                {getStatusBadge(period.status)}
                            </div>
                            <p className="text-slate-500 mt-1">
                                {formatDate(period.start_date)} - {formatDate(period.end_date)} |
                                Pembayaran: {formatDate(period.payment_date)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Karyawan</p>
                        <p className="text-2xl font-bold text-slate-900">{period.payroll_entries?.length || 0}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Gross Salary</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalGross)}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-500">Total Net Salary</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalNet)}</p>
                    </div>
                </div>

                {/* Payroll Entries */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Detail Slip Gaji</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Karyawan</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Hari Kerja</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Gaji Pokok</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Tunjangan</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Lembur</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Bonus</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Potongan</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Gaji Bersih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {period.payroll_entries?.map((entry: any) => (
                                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{entry.employees.full_name}</p>
                                                <p className="text-xs text-slate-500">{entry.employees.nik} • {entry.employees.department}</p>
                                            </div>
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-slate-700">
                                            {entry.total_work_days} hari
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-slate-900 font-medium">
                                            {formatCurrency(entry.base_salary)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-emerald-600">
                                            +{formatCurrency(entry.total_allowances)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-blue-600">
                                            +{formatCurrency(entry.total_overtime)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-purple-600">
                                            +{formatCurrency(entry.total_bonuses)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-red-600">
                                            -{formatCurrency(entry.total_deductions)}
                                        </td>
                                        <td className="text-right py-3 px-4 text-base font-bold text-slate-900">
                                            {formatCurrency(entry.net_salary)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-300 bg-slate-50">
                                    <td className="py-4 px-4 font-bold text-slate-900" colSpan={2}>TOTAL</td>
                                    <td className="text-right py-4 px-4 font-bold text-slate-900">
                                        {formatCurrency(period.payroll_entries?.reduce((s: number, e: any) => s + e.base_salary, 0) || 0)}
                                    </td>
                                    <td className="text-right py-4 px-4 font-bold text-emerald-600">
                                        {formatCurrency(period.payroll_entries?.reduce((s: number, e: any) => s + e.total_allowances, 0) || 0)}
                                    </td>
                                    <td className="text-right py-4 px-4 font-bold text-blue-600">
                                        {formatCurrency(period.payroll_entries?.reduce((s: number, e: any) => s + e.total_overtime, 0) || 0)}
                                    </td>
                                    <td className="text-right py-4 px-4 font-bold text-purple-600">
                                        {formatCurrency(period.payroll_entries?.reduce((s: number, e: any) => s + e.total_bonuses, 0) || 0)}
                                    </td>
                                    <td className="text-right py-4 px-4 font-bold text-red-600">
                                        -{formatCurrency(totalDeductions)}
                                    </td>
                                    <td className="text-right py-4 px-4 text-lg font-bold text-purple-700">
                                        {formatCurrency(totalNet)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Info Messages */}
                {period.status === 'draft' && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-sm text-amber-800">
                            💡 <strong>Status: Draft</strong> - Payroll masih bisa diedit. Klik "Submit untuk Approval" di halaman list untuk mengirim ke Owner.
                        </p>
                    </div>
                )}

                {period.status === 'pending_approval' && isOwner && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-800">
                            👑 <strong>Menunggu Approval Anda</strong> - Silakan review slip gaji di atas. Jika sudah benar, klik "Approve Payroll" di halaman list.
                        </p>
                    </div>
                )}

                {period.status === 'approved' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-sm text-emerald-800">
                            ✅ <strong>Payroll Approved</strong> - Kasbon sudah otomatis terpotong. Slip gaji siap dicetak.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
