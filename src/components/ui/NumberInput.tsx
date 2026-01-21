'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface NumberInputProps {
    value: number | string
    onChange: (value: number) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    min?: number
    max?: number
    allowEmpty?: boolean
}

/**
 * Number Input Component with better UX
 * - Auto-selects on focus for easy editing
 * - No leading zeros
 * - Clean number handling
 */
export default function NumberInput({
    value,
    onChange,
    placeholder = '0',
    className = '',
    disabled = false,
    min,
    max,
    allowEmpty = false,
}: NumberInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Parse string to number with constraints
    const parseNumber = useCallback((str: string): number => {
        if (!str && allowEmpty) return 0
        const cleaned = str.replace(/[^\d-]/g, '')
        const result = parseInt(cleaned) || 0

        if (min !== undefined && result < min) return min
        if (max !== undefined && result > max) return max

        return result
    }, [min, max, allowEmpty])

    // Initialize display value from prop
    useEffect(() => {
        if (!isFocused) {
            const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
            setDisplayValue(numValue > 0 ? numValue.toString() : (allowEmpty ? '' : '0'))
        }
    }, [value, isFocused, allowEmpty])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true)
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
        setDisplayValue(numValue > 0 ? numValue.toString() : '')
        // Select all text
        setTimeout(() => {
            e.target.select()
        }, 0)
    }

    const handleBlur = () => {
        setIsFocused(false)
        const numValue = parseNumber(displayValue)
        setDisplayValue(numValue > 0 ? numValue.toString() : (allowEmpty ? '' : '0'))
        onChange(numValue)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        // Only allow digits
        const cleaned = inputValue.replace(/[^\d]/g, '')
        // Remove leading zeros
        const noLeadingZeros = cleaned.replace(/^0+/, '') || (cleaned.length > 0 ? '0' : '')
        setDisplayValue(noLeadingZeros)

        const numValue = parseInt(noLeadingZeros) || 0
        onChange(numValue)
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
    )
}
