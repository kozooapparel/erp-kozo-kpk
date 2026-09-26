'use client'

import { useEffect, useRef, useState } from 'react'
import {
    DATE_RANGE_PRESETS,
    DEFAULT_DATE_RANGE,
    DateRangePreset,
    DateRangeValue,
    formatRangeLabel,
    resolveDateRange,
} from '@/lib/utils/date-range'

interface DateRangeFilterProps {
    value: DateRangeValue
    onChange: (value: DateRangeValue) => void
    /** Warna aksen saat filter aktif, mengikuti tema halaman. */
    accent?: 'orange' | 'emerald' | 'slate'
    align?: 'left' | 'right'
    /** Lebarkan tombol mengikuti kontainer (untuk grid filter berlabel). */
    fullWidth?: boolean
    className?: string
}

const ACCENT_ACTIVE: Record<NonNullable<DateRangeFilterProps['accent']>, string> = {
    orange: 'border-orange-300 bg-orange-50 text-orange-700',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-300 bg-slate-100 text-slate-700',
}

const Icon = {
    Calendar: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    ),
    Chevron: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    ),
    Check: (p: { className?: string }) => (
        <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
}

/**
 * Filter rentang tanggal bergaya Google Analytics / YouTube Creator Studio:
 * daftar preset siap pakai + rentang kustom dalam satu popover.
 */
export default function DateRangeFilter({
    value,
    onChange,
    accent = 'slate',
    align = 'right',
    fullWidth = false,
    className = '',
}: DateRangeFilterProps) {
    const [open, setOpen] = useState(false)
    const [pendingFrom, setPendingFrom] = useState(value.from ?? '')
    const [pendingTo, setPendingTo] = useState(value.to ?? '')
    const [customTouched, setCustomTouched] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Tutup popover saat klik di luar atau tekan Escape
    useEffect(() => {
        if (!open) return
        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    const toggleOpen = () => {
        setOpen((prev) => {
            const next = !prev
            if (next) {
                setPendingFrom(value.from ?? '')
                setPendingTo(value.to ?? '')
                setCustomTouched(false)
            }
            return next
        })
    }

    const selectPreset = (preset: DateRangePreset) => {
        if (preset === 'custom') {
            setCustomTouched(true)
            return
        }
        onChange(resolveDateRange(preset))
        setOpen(false)
    }

    const applyCustom = () => {
        // Tidak ada perubahan pada rentang kustom -> biarkan preset yang aktif
        if (!customTouched && value.preset !== 'custom') {
            setOpen(false)
            return
        }
        if (!pendingFrom && !pendingTo) {
            onChange(DEFAULT_DATE_RANGE)
            setOpen(false)
            return
        }
        const from = pendingFrom || null
        const to = pendingTo || null
        // Toleransi bila user mengisi tanggal terbalik
        const normalized = from && to && from > to ? { from: to, to: from } : { from, to }
        onChange(resolveDateRange('custom', normalized))
        setOpen(false)
    }

    const reset = () => {
        onChange(DEFAULT_DATE_RANGE)
        setPendingFrom('')
        setPendingTo('')
        setCustomTouched(false)
        setOpen(false)
    }

    const isActive = value.preset !== 'allTime'

    return (
        <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
            <button
                type="button"
                onClick={toggleOpen}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${fullWidth ? 'w-full justify-between' : ''
                    } ${isActive
                        ? ACCENT_ACTIVE[accent]
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
            >
                <Icon.Calendar className="w-4 h-4 shrink-0" />
                <span className={`truncate ${fullWidth ? 'flex-1 text-left' : 'max-w-[11rem]'}`}>
                    {formatRangeLabel(value)}
                </span>
                <Icon.Chevron className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Filter rentang tanggal"
                    className={`absolute z-50 mt-2 w-[19rem] sm:w-[21rem] rounded-xl border border-slate-200 bg-white shadow-xl ${align === 'right' ? 'right-0' : 'left-0'
                        }`}
                >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">Rentang tanggal</p>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Tutup"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Preset */}
                    <div className="max-h-64 overflow-y-auto p-1.5">
                        {DATE_RANGE_PRESETS.map((preset) => {
                            const active = value.preset === preset.value
                            return (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => selectPreset(preset.value)}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${active
                                        ? 'bg-slate-900 font-medium text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <span>{preset.label}</span>
                                    {active && <Icon.Check className="w-4 h-4" />}
                                </button>
                            )
                        })}
                        <button
                            type="button"
                            onClick={() => selectPreset('custom')}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${value.preset === 'custom'
                                ? 'bg-slate-900 font-medium text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <span>Kustom</span>
                            {value.preset === 'custom' && <Icon.Check className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Rentang kustom */}
                    <div className="border-t border-slate-100 px-4 py-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Rentang kustom
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">Mulai</span>
                                <input
                                    type="date"
                                    value={pendingFrom}
                                    max={pendingTo || undefined}
                                    onChange={(e) => {
                                        setPendingFrom(e.target.value)
                                        setCustomTouched(true)
                                    }}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs text-slate-500">Selesai</span>
                                <input
                                    type="date"
                                    value={pendingTo}
                                    min={pendingFrom || undefined}
                                    onChange={(e) => {
                                        setPendingTo(e.target.value)
                                        setCustomTouched(true)
                                    }}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                                />
                            </label>
                        </div>
                        {customTouched && (
                            <p className="mt-2 text-xs text-slate-400">
                                {formatRangeLabel(resolveDateRange('custom', { from: pendingFrom || null, to: pendingTo || null }))}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                        <button
                            type="button"
                            onClick={reset}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Atur ulang
                        </button>
                        <button
                            type="button"
                            onClick={applyCustom}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                        >
                            Terapkan
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
