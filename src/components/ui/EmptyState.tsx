import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  variant?: 'default' | 'compact'
}

export function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${variant === 'compact' ? 'py-8' : 'py-16 px-6'}`}>
      {icon && (
        <div className={`${variant === 'compact' ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'} rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-400`}>
          {icon}
        </div>
      )}
      <h3 className="text-h3 text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-md">{description}</p>
      )}
      {action && (
        <div className="mt-5">{action}</div>
      )}
    </div>
  )
}

interface DefaultEmptyIconProps {
  className?: string
}

export function DefaultEmptyIcon({ className = 'w-8 h-8' }: DefaultEmptyIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  )
}
