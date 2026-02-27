'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Employee {
    id: string
    nik: string
    full_name: string
    department: string
    position: string
    daily_rate: number
    join_date: string
    status: string
}

interface EmployeeListClientProps {
    employees: Employee[]
}

export default function EmployeeListClient({ employees }: EmployeeListClientProps) {
    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')

    // Get unique departments
    const departments = [...new Set(employees.map(e => e.department))].sort()

    const filteredEmployees = employees.filter(e => {
        const matchSearch = search === '' ||
            e.full_name.toLowerCase().includes(search.toLowerCase()) ||
            e.nik.toLowerCase().includes(search.toLowerCase()) ||
            e.position.toLowerCase().includes(search.toLowerCase())
        const matchDept = departmentFilter === 'all' || e.department === departmentFilter
        return matchSearch && matchDept
    })

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
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Daftar Karyawan</h2>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, NIK, atau posisi..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className={`px-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer ${departmentFilter !== 'all'
                        ? 'bg-slate-700 text-white border-slate-700 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200'
                        }`}
                >
                    <option value="all" className="bg-white text-slate-700">Semua Department</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept} className="bg-white text-slate-700">
                            {dept}
                        </option>
                    ))}
                </select>
            </div>

            {/* Results count */}
            <p className="text-sm text-slate-500 mb-3">
                {filteredEmployees.length} karyawan ditemukan
            </p>

            {filteredEmployees.length > 0 ? (
                <div className="space-y-3">
                    {filteredEmployees.map((employee) => (
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
                    <p className="text-slate-500">Tidak ada karyawan ditemukan</p>
                    <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci pencarian</p>
                </div>
            )}
        </div>
    )
}
