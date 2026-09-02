'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface NumberInputProps {
    /** Controlled mode: pass `value` + `onChange` */
    value?: number | string
    /** Uncontrolled mode: pass `defaultValue` + optional `name` (for FormData) */
    defaultValue?: number | string
    onChange?: (value: number) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    min?: number
    max?: number
    allowEmpty?: boolean
    /** Allow decimal values (e.g. meter/kg). Formats with id-ID (koma) separator. */
    decimal?: boolean
    /** Show thousand separators while typing. Set false for year-like fields (e.g. 2026). */
    groupThousands?: boolean
    name?: string
    autoFocus?: boolean
    required?: boolean
}

// Raw digit string (no thousand separators) from any value
function toRawString(v: number | string | undefined | null, decimal: boolean): string {
    if (v === undefined || v === null || v === '') return ''
    const num = typeof v === 'string' ? parseFloat(v) || 0 : v || 0
    if (decimal) {
        const s = String(num)
        return s.includes('.') ? s : s
    }
    return num > 0 ? String(Math.floor(num)) : ''
}

// Format integer digits with id-ID thousand separators (100000 -> "100.000")
function formatDigits(digits: string): string {
    if (!digits) return ''
    const num = parseInt(digits, 10)
    if (isNaN(num)) return ''
    return num.toLocaleString('id-ID')
}

// Format a number with id-ID separators, optionally with decimals (100000 -> "100.000"; 12.5 -> "12,5")
function formatNumber(num: number, decimal: boolean, groupThousands = true): string {
    if (decimal) {
        return num.toLocaleString('id-ID', { maximumFractionDigits: 2, useGrouping: groupThousands })
    }
    return groupThousands
        ? Math.floor(num).toLocaleString('id-ID')
        : String(Math.floor(num))
}

/**
 * Number Input Component with better UX
 * - Live thousand separators (.) while typing (100000 -> "100.000")
 * - No leading zeros
 * - Auto-selects on focus for easy editing
 * - Supports integer or decimal values
 * - Supports controlled (value/onChange) and uncontrolled (defaultValue/name) modes
 */
export default function NumberInput({
    value,
    defaultValue,
    onChange,
    placeholder = '0',
    className = '',
    disabled = false,
    min,
    max,
    allowEmpty = false,
    decimal = false,
    groupThousands = true,
    name,
    autoFocus,
    required = false,
}: NumberInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const isControlled = value !== undefined

    const [rawValue, setRawValue] = useState<number>(() => {
        const raw = toRawString(isControlled ? value : defaultValue, decimal)
        return parseFloat(raw.replace(',', '.')) || 0
    })
    const [displayValue, setDisplayValue] = useState<string>(() => {
        const raw = toRawString(isControlled ? value : defaultValue, decimal)
        if (!raw) return allowEmpty ? '' : '0'
        return formatNumber(parseFloat(raw.replace(',', '.')) || 0, decimal)
    })
    const [isFocused, setIsFocused] = useState(false)
    const touchedRef = useRef(false)

    const applyConstraints = useCallback((num: number): number => {
        if (min !== undefined && num < min) return min
        if (max !== undefined && num > max) return max
        return num
    }, [min, max])

    // Sync with external value (controlled) or defaultValue (uncontrolled, if untouched)
    useEffect(() => {
        if (isFocused) return
        const source = isControlled ? value : (touchedRef.current ? undefined : defaultValue)
        if (source === undefined) return
        const raw = toRawString(source, decimal)
        if (!raw) {
            setRawValue(0)
            setDisplayValue(allowEmpty ? '' : '0')
            return
        }
        const num = parseFloat(raw.replace(',', '.')) || 0
        setRawValue(num)
        setDisplayValue(formatNumber(num, decimal))
    }, [value, defaultValue, isControlled, isFocused, allowEmpty, decimal])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true)
        setTimeout(() => {
            e.target.select()
        }, 0)
    }

    const handleBlur = () => {
        setIsFocused(false)
        const clamped = applyConstraints(rawValue)
        setRawValue(clamped)
        setDisplayValue(clamped !== 0 ? formatNumber(clamped, decimal, groupThousands) : (allowEmpty ? '' : '0'))
        onChange?.(clamped)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        touchedRef.current = true
        let raw: string
        if (decimal) {
            // Allow digits and a single comma/period as decimal separator
            raw = e.target.value.replace(/[^\d.,]/g, '')
            // Remove thousand separators (dots), keep one decimal separator
            raw = raw.replace(/\./g, '')
            const parts = raw.split(',')
            if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('')
            if (parts.length === 2) raw = parts[0] + ',' + parts[1].slice(0, 2)
            if (raw === ',' ) raw = ''
            if (raw.startsWith(',')) raw = '0' + raw
        } else {
            raw = e.target.value.replace(/[^\d]/g, '')
        }
        // Remove leading zeros (keep single "0" for zero)
        raw = raw.replace(/^0+(?=\d)/, '')

        const formatted = decimal ? raw : (groupThousands ? formatDigits(raw) : raw)
        setDisplayValue(formatted)

        const num = applyConstraints(parseFloat(raw.replace(',', '.')) || 0)
        setRawValue(num)
        onChange?.(num)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
        if (allowedKeys.includes(e.key)) return

        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return

        if (decimal) {
            if (!/[\d.,]/.test(e.key)) e.preventDefault()
            if (e.key === ',' || e.key === '.') {
                if (displayValue.includes(',')) e.preventDefault()
            }
        } else if (!/^\d$/.test(e.key)) {
            e.preventDefault()
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                inputMode={decimal ? 'decimal' : 'numeric'}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${className}`}
            />
            {name && (
                <input
                    type="hidden"
                    name={name}
                    required={required}
                    value={rawValue === 0 && allowEmpty ? '' : rawValue}
                />
            )}
        </>
    )
}
