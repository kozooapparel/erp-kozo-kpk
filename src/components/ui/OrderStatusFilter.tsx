'use client'

import { useState } from 'react'

type OrderFilter = 'all' | 'needs_action' | 'ready_move' | 'bottleneck' | 'deadline_soon'

interface OrderStatusFilterProps {
    onFilterChange: (filter: OrderFilter) => void
}

const FILTER_OPTIONS: { value: OrderFilter; label: string; activeColor: string }[] = [
    { value: 'all', label: 'Semua', activeColor: 'bg-slate-700 text-white' },
    { value: 'needs_action', label: 'Perlu Action', activeColor: 'bg-red-500 text-white' },
    { value: 'ready_move', label: 'Siap Pindah', activeColor: 'bg-emerald-500 text-white' },
    { value: 'bottleneck', label: 'Bottleneck', activeColor: 'bg-amber-500 text-white' },
    { value: 'deadline_soon', label: 'Deadline Dekat', activeColor: 'bg-purple-500 text-white' },
]

export default function OrderStatusFilter({ onFilterChange }: OrderStatusFilterProps) {
    const [activeFilter, setActiveFilter] = useState<OrderFilter>('all')

    const handleClick = (filter: OrderFilter) => {
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

export type { OrderFilter }
