/**
 * Currency and Number Formatting Utilities
 */

/**
 * Format number as Indonesian Rupiah
 * @param value - Number to format
 * @returns Formatted currency string (e.g., "Rp 1.820.000")
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Format number with thousand separator
 * @param value - Number to format
 * @returns Formatted number string (e.g., "1.820.000")
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Parse Indonesian formatted number string to number
 * @param value - Formatted string (e.g., "1.820.000")
 * @returns Number value
 */
export function parseFormattedNumber(value: string): number {
    // Remove currency symbol, dots, and replace comma with dot for decimals
    const cleaned = value
        .replace(/[Rp\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')

    return parseFloat(cleaned) || 0
}

/**
 * Format date as Indonesian format
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "19 Januari 2026")
 */
export function formatDate(date: string | Date | null): string {
    if (!date) return '-'

    const d = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(d)
}

/**
 * Format date as short format
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "19/01/2026")
 */
export function formatDateShort(date: string | Date | null): string {
    if (!date) return '-'

    const d = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d)
}

/**
 * Format date for input[type="date"]
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "2026-01-19")
 */
export function formatDateInput(date: string | Date | null): string {
    if (!date) return ''

    const d = typeof date === 'string' ? new Date(date) : date

    return d.toISOString().split('T')[0]
}

/**
 * Calculate due date from invoice date and payment terms
 * @param invoiceDate - Invoice date
 * @param termin - Payment terms in days
 * @returns Due date
 */
export function calculateDueDate(invoiceDate: Date, termin: number): Date {
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + termin)
    return dueDate
}
