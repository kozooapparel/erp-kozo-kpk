/**
 * Invoice Number Generator
 * Format: INV/YYMMDD/CustomerName
 * Example: INV/260119/Erbogapparel
 */

/**
 * Sanitize customer name for use in invoice number
 * - Remove special characters
 * - Remove spaces or replace with nothing
 * - Limit length
 */
function sanitizeCustomerName(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .substring(0, 20) // Limit to 20 chars
        .toUpperCase()
}

/**
 * Format date as YYMMDD
 */
function formatDateForInvoice(date: Date): string {
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 * Generate invoice number
 * @param customerName - Customer name
 * @param date - Invoice date (defaults to today)
 * @returns Invoice number in format INV/YYMMDD/CustomerName
 * @example
 * generateInvoiceNumber('Erbogapparel') // "INV/260119/ERBOGAPPAREL"
 * generateInvoiceNumber('PT. Noprizal Ariyadi', new Date('2026-01-19')) // "INV/260119/PTNOPRIZALARIYADI"
 */
export function generateInvoiceNumber(customerName: string, date: Date = new Date()): string {
    const dateStr = formatDateForInvoice(date)
    const sanitizedName = sanitizeCustomerName(customerName)
    return `INV/${dateStr}/${sanitizedName}`
}

/**
 * Parse invoice number to extract components
 */
export function parseInvoiceNumber(noInvoice: string): {
    prefix: string
    dateStr: string
    customerName: string
} | null {
    const parts = noInvoice.split('/')
    if (parts.length !== 3) return null

    return {
        prefix: parts[0],
        dateStr: parts[1],
        customerName: parts[2]
    }
}

/**
 * Get invoice date from invoice number
 */
export function getDateFromInvoiceNumber(noInvoice: string): Date | null {
    const parsed = parseInvoiceNumber(noInvoice)
    if (!parsed) return null

    const { dateStr } = parsed
    if (dateStr.length !== 6) return null

    const year = 2000 + parseInt(dateStr.substring(0, 2))
    const month = parseInt(dateStr.substring(2, 4)) - 1
    const day = parseInt(dateStr.substring(4, 6))

    return new Date(year, month, day)
}
