/**
 * Date Range Utilities
 * Preset rentang tanggal ala Google Analytics / YouTube Creator Studio.
 */

export type DateRangePreset =
    | 'today'
    | 'yesterday'
    | 'last7'
    | 'last28'
    | 'last90'
    | 'thisMonth'
    | 'lastMonth'
    | 'thisYear'
    | 'allTime'
    | 'custom'

export interface DateRangeValue {
    preset: DateRangePreset
    /** Inclusive start, format YYYY-MM-DD. null = tanpa batas. */
    from: string | null
    /** Inclusive end, format YYYY-MM-DD. null = tanpa batas. */
    to: string | null
}

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
    { value: 'today', label: 'Hari ini' },
    { value: 'yesterday', label: 'Kemarin' },
    { value: 'last7', label: '7 hari terakhir' },
    { value: 'last28', label: '28 hari terakhir' },
    { value: 'last90', label: '90 hari terakhir' },
    { value: 'thisMonth', label: 'Bulan ini' },
    { value: 'lastMonth', label: 'Bulan lalu' },
    { value: 'thisYear', label: 'Tahun ini' },
    { value: 'allTime', label: 'Sepanjang waktu' },
]

export const DEFAULT_DATE_RANGE: DateRangeValue = { preset: 'allTime', from: null, to: null }

/** Format Date ke YYYY-MM-DD memakai waktu lokal (bukan UTC). */
export function toDateString(date: Date): string {
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, '0')
    const d = `${date.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
}

function shiftDays(base: Date, days: number): Date {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    return d
}

/**
 * Ubah preset (+ tanggal kustom) menjadi rentang konkret.
 */
export function resolveDateRange(
    preset: DateRangePreset,
    custom?: { from: string | null; to: string | null }
): DateRangeValue {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (preset) {
        case 'today':
            return { preset, from: toDateString(today), to: toDateString(today) }
        case 'yesterday': {
            const y = shiftDays(today, -1)
            return { preset, from: toDateString(y), to: toDateString(y) }
        }
        case 'last7':
            return { preset, from: toDateString(shiftDays(today, -6)), to: toDateString(today) }
        case 'last28':
            return { preset, from: toDateString(shiftDays(today, -27)), to: toDateString(today) }
        case 'last90':
            return { preset, from: toDateString(shiftDays(today, -89)), to: toDateString(today) }
        case 'thisMonth':
            return {
                preset,
                from: toDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
                to: toDateString(today),
            }
        case 'lastMonth':
            return {
                preset,
                from: toDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                to: toDateString(new Date(today.getFullYear(), today.getMonth(), 0)),
            }
        case 'thisYear':
            return {
                preset,
                from: toDateString(new Date(today.getFullYear(), 0, 1)),
                to: toDateString(today),
            }
        case 'custom':
            return { preset, from: custom?.from ?? null, to: custom?.to ?? null }
        default:
            return { preset: 'allTime', from: null, to: null }
    }
}

function formatLabelDate(value: string): string {
    const [y, m, d] = value.split('-').map(Number)
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(y, (m || 1) - 1, d || 1))
}

/** Label singkat untuk tombol / header, mis. "7 hari terakhir" atau "1 Jan 2026 – 31 Jan 2026". */
export function formatRangeLabel(range: DateRangeValue): string {
    const presetLabel = DATE_RANGE_PRESETS.find((p) => p.value === range.preset)?.label
    if (range.preset !== 'custom') return presetLabel ?? 'Sepanjang waktu'
    if (!range.from && !range.to) return 'Rentang kustom'
    if (range.from && range.to) return `${formatLabelDate(range.from)} – ${formatLabelDate(range.to)}`
    return range.from ? `Sejak ${formatLabelDate(range.from)}` : `Hingga ${formatLabelDate(range.to!)}`
}

/** Normalisasi nilai tanggal dari DB menjadi YYYY-MM-DD agar bisa dibandingkan langsung. */
function toDateKey(value: string | Date): string | null {
    if (typeof value === 'string') {
        const iso = value.match(/^(\d{4}-\d{2}-\d{2})/)
        if (iso) return iso[1]
    }
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return toDateString(d)
}

/** Cek apakah sebuah tanggal berada di dalam rentang (inclusive). */
export function isDateInRange(value: string | Date | null | undefined, range: DateRangeValue): boolean {
    if (!range.from && !range.to) return true
    if (!value) return false

    const key = toDateKey(value)
    if (!key) return false
    if (range.from && key < range.from) return false
    if (range.to && key > range.to) return false
    return true
}
