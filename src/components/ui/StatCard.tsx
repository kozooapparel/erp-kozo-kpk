import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  helper?: string
}

const toneStyles = {
  default: {
    icon: 'bg-slate-100 text-slate-600',
    value: 'text-slate-900',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-600',
    value: 'text-emerald-700',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600',
    value: 'text-amber-700',
  },
  danger: {
    icon: 'bg-red-50 text-red-600',
    value: 'text-red-700',
  },
  info: {
    icon: 'bg-blue-50 text-blue-600',
    value: 'text-blue-700',
  },
  brand: {
    icon: 'bg-red-50 text-red-600',
    value: 'text-red-600',
  },
}

export function StatCard({ label, value, icon, tone = 'default', delta, trend, helper }: StatCardProps) {
  const t = toneStyles[tone]

  return (
    <div className="surface p-4 md:p-5 surface-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-slate-500">{label}</p>
          <p className={`mt-1.5 text-xl md:text-2xl font-bold tracking-tight text-mono truncate ${t.value}`}>
            {value}
          </p>
          {(delta || helper) && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {delta && trend && (
                <span className={`inline-flex items-center gap-0.5 font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {trend === 'flat' && '→'}
                  {delta}
                </span>
              )}
              {helper && <span className="text-slate-500">{helper}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${t.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
