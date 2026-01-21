'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface CurrencyInputProps {
    value: number | string
    onChange: (value: number) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    showPrefix?: boolean
    min?: number
    max?: number
}

/**
 * Currency/Number Input Component with better UX
 * - Auto-formats with thousand separators (.)
 * - Auto-selects on focus for easy editing
 * - Shows "Rp" prefix optionally
 * - Returns raw number value
 */
export default function CurrencyInput({
    value,
    onChange,
    placeholder = '0',
    className = '',
    disabled = false,
    showPrefix = true,
    min,
    max,
}: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Format number with thousand separator
    const formatNumber = useCallback((num: number | string): string => {
        if (num === '' || num === null || num === undefined) return ''
        const numValue = typeof num === 'string' ? parseFloat(num.replace(/\./g, '')) : num
        if (isNaN(numValue)) return ''
        return numValue.toLocaleString('id-ID')
    }, [])

    // Parse formatted string back to number
    const parseNumber = useCallback((str: string): number => {
        if (!str) return 0
        // Remove all non-digit characters except minus
        const cleaned = str.replace(/[^\d-]/g, '')
        const result = parseInt(cleaned) || 0

        // Apply min/max constraints
        if (min !== undefined && result < min) return min
        if (max !== undefined && result > max) return max

        return result
    }, [min, max])

    // Initialize display value from prop
    useEffect(() => {
        if (!isFocused) {
            const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
            setDisplayValue(formatNumber(numValue))
        }
    }, [value, isFocused, formatNumber])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true)
        // Show raw number on focus for easy editing
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
        setDisplayValue(numValue > 0 ? numValue.toString() : '')
        // Select all text after a short delay (for browser compatibility)
        setTimeout(() => {
            e.target.select()
        }, 0)
    }

    const handleBlur = () => {
        setIsFocused(false)
        // Format on blur
        const numValue = parseNumber(displayValue)
        setDisplayValue(formatNumber(numValue))
        onChange(numValue)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        // Only allow digits
        const cleaned = inputValue.replace(/[^\d]/g, '')
        setDisplayValue(cleaned)

        // Live update the value
        const numValue = parseInt(cleaned) || 0
        onChange(numValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, arrows
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
        if (allowedKeys.includes(e.key)) return

        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return

        // Block non-digits
        if (!/^\d$/.test(e.key)) {
            e.preventDefault()
        }
    }

    return (
        <div className="relative">
            {showPrefix && !isFocused && displayValue && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                    Rp
                </span>
            )}
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
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${showPrefix && !isFocused && displayValue ? 'pl-10' : ''} ${className}`}
            />
        </div>
    )
}
