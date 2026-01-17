'use client'

import { DashboardMetrics } from '@/types/database'

interface MetricsBarProps {
    metrics: DashboardMetrics
}

export default function MetricsBar({ metrics }: MetricsBarProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const metricsData = [
        {
            label: 'Total Orders',
            value: metrics.total_active_orders,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'from-blue-500 to-cyan-500',
        },
        {
            label: 'Belum Lunas',
            value: metrics.total_unpaid_orders,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'from-amber-500 to-orange-500',
        },
        {
            label: 'Total Piutang',
            value: formatCurrency(metrics.total_receivables),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'from-emerald-500 to-teal-500',
        },
        {
            label: 'Bottleneck',
            value: metrics.bottleneck_count,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: metrics.bottleneck_count > 0 ? 'from-red-500 to-rose-500' : 'from-slate-500 to-slate-600',
            alert: metrics.bottleneck_count > 0,
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricsData.map((metric, index) => (
                <div
                    key={index}
                    className={`relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 ${metric.alert ? 'animate-pulse ring-2 ring-red-500/50' : ''
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${metric.color}`}>
                            <span className="text-white">{metric.icon}</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-medium">{metric.label}</p>
                            <p className="text-white text-xl font-bold">{metric.value}</p>
                        </div>
                    </div>
                    {metric.alert && (
                        <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
