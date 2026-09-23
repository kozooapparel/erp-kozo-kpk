import { Order, ProductionSpecs } from '@/types/database'

/** Lama produksi standar sejak form order dibuat. */
export const PRODUKSI_DURATION_DAYS = 14

/**
 * Deadline produksi = tanggal order dibuat + 14 hari.
 * Dihitung otomatis, tidak diinput manual.
 */
export function getDeadlineProduksi(createdAt: string): Date {
    const deadline = new Date(createdAt)
    deadline.setDate(deadline.getDate() + PRODUKSI_DURATION_DAYS)
    return deadline
}

export function formatTanggal(value: string | Date | null | undefined): string {
    if (!value) return '-'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Form order dianggap terisi bila detail produk inti sudah diisi.
 * Dipakai sebagai syarat pindah stage dari dp_produksi.
 */
export function hasFormOrderData(
    order: Pick<Order, 'production_specs' | 'size_breakdown' | 'spk_sections'>
): boolean {
    const specs = order.production_specs as ProductionSpecs | null
    if (specs) {
        const filled =
            !!specs.jenis_produk?.trim() ||
            !!specs.jenis_bahan?.trim() ||
            !!specs.model_kerah?.trim() ||
            !!specs.model_lengan?.trim() ||
            (specs.jumlah_produksi ?? 0) > 0
        if (filled) return true
    }

    // Data SPK lama tetap dianggap valid supaya order berjalan tidak tertahan.
    if (order.spk_sections && order.spk_sections.length > 0) return true
    if (order.size_breakdown && Object.keys(order.size_breakdown).length > 0) return true

    return false
}
