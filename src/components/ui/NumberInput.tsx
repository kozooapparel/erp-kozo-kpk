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
    name?: string
}

// Raw digits (no thousand separators) from any value
function toRawString(v: number | string | undefined | null): string {
    if (v === undefined || v === null || v === '') return ''
    const num = typeof v === 'string' ? parseFloat(v) || 0 : v || 0
    return num > 0 ? String(Math.floor(num)) : ''
}

// Format raw digits with id-ID thousand separators (100000 -> "100.000")
function formatDigits(digits: string): string {
    if (!digits) return ''
    const num = parseInt(digits, 10)
    if (isNaN(num)) return ''
    return num.toLocaleString('id-ID')
}

/**
 * Number Input Component with better UX
 * - Live thousand separators (.) while typing
 * - No leading zeros
 * - Auto-selects on focus for easy editing
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
    name,
}: NumberInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const isControlled = value !== undefined

    const [rawValue, setRawValue] = useState<number>(() => {
        const digits = toRawString(isControlled ? value : defaultValue)
        return parseInt(digits) || 0
    })
    const [displayValue, setDisplayValue] = useState<string>(() => {
        const digits = toRawString(isControlled ? value : defaultValue)
        return digits ? formatDigits(digits) : (allowEmpty ? '' : '0')
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
        const digits = toRawString(source)
        const num = parseInt(digits) || 0
        setRawValue(num)
        setDisplayValue(digits ? formatDigits(digits) : (allowEmpty ? '' : '0'))
    }, [value, defaultValue, isControlled, isFocused, allowEmpty])

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
        setDisplayValue(clamped > 0 ? formatDigits(String(clamped)) : (allowEmpty ? '' : '0'))
        onChange?.(clamped)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        touchedRef.current = true
        // Only allow digits, remove leading zeros (keep single "0" for zero)
        const cleaned = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')
        // Live thousand separator while typing
        const formatted = formatDigits(cleaned)
        setDisplayValue(formatted)

        const num = applyConstraints(parseInt(cleaned) || 0)
        setRawValue(num)
        onChange?.(num)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
        if (allowedKeys.includes(e.key)) return

        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return

        if (!/^\d$/.test(e.key)) {
            e.preventDefault()
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${className}`}
            />
            {name && (
                <input type="hidden" name={name} value={rawValue} />
            )}
        </>
    )
}
