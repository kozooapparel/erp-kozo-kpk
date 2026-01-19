'use client'

import { useState } from 'react'

type PaymentFilter = 'all' | 'belum_bayar' | 'dp_desain' | 'dp_50' | 'lunas'

interface PaymentStatusFilterProps {
    onFilterChange: (filter: PaymentFilter) => void
}

const FILTER_OPTIONS: { value: PaymentFilter; label: string; activeColor: string }[] = [
    { value: 'all', label: 'Semua', activeColor: 'bg-slate-700 text-white' },
    { value: 'belum_bayar', label: 'Belum Bayar', activeColor: 'bg-red-500 text-white' },
    { value: 'dp_desain', label: 'DP Desain', activeColor: 'bg-blue-500 text-white' },
    { value: 'dp_50', label: 'DP 50%', activeColor: 'bg-amber-500 text-white' },
    { value: 'lunas', label: 'Lunas', activeColor: 'bg-emerald-500 text-white' },
]

export default function PaymentStatusFilter({ onFilterChange }: PaymentStatusFilterProps) {
    const [activeFilter, setActiveFilter] = useState<PaymentFilter>('all')

    const handleClick = (filter: PaymentFilter) => {
        setActiveFilter(filter)
        onFilterChange(filter)
    }

    return (
        <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => handleClick(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${activeFilter === option.value
                            ? `${option.activeColor} shadow-sm`
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

export type { PaymentFilter }
