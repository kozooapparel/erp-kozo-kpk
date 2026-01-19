'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    Kuitansi,
    KuitansiInsert,
    KuitansiWithInvoice
} from '@/types/database'

export interface KuitansiFilters {
    invoiceId?: string
    dateFrom?: string
    dateTo?: string
}

/**
 * Get kuitansi list with filters
 */
export async function getKuitansiList(filters?: KuitansiFilters): Promise<KuitansiWithInvoice[]> {
    const supabase = await createClient()

    let query = supabase
        .from('kuitansi')
        .select(`
            *,
            invoice:invoices(
                *,
                customer:customers(*)
            )
        `)
        .order('created_at', { ascending: false })

    if (filters?.invoiceId) {
        query = query.eq('invoice_id', filters.invoiceId)
    }

    if (filters?.dateFrom) {
        query = query.gte('tanggal', filters.dateFrom)
    }

    if (filters?.dateTo) {
        query = query.lte('tanggal', filters.dateTo)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching kuitansi:', error)
        throw new Error('Failed to fetch kuitansi')
    }

    return data || []
}

/**
 * Get kuitansi by ID
 */
export async function getKuitansiById(id: string): Promise<KuitansiWithInvoice | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('kuitansi')
        .select(`
            *,
            invoice:invoices(
                *,
                customer:customers(*)
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching kuitansi:', error)
        return null
    }

    return data
}

/**
 * Get kuitansi by invoice ID
 */
export async function getKuitansiByInvoiceId(invoiceId: string): Promise<Kuitansi[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('kuitansi')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('tanggal', { ascending: true })

    if (error) {
        console.error('Error fetching kuitansi by invoice:', error)
        return []
    }

    return data || []
}

/**
 * Create new kuitansi (payment receipt)
 */
export async function createKuitansi(data: Omit<KuitansiInsert, 'no_kuitansi' | 'keterangan'>): Promise<Kuitansi | null> {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get invoice details for keterangan
    const { data: invoice } = await supabase
        .from('invoices')
        .select('no_invoice, sisa_tagihan')
        .eq('id', data.invoice_id)
        .single()

    if (!invoice) {
        throw new Error('Invoice not found')
    }

    // Validate payment amount
    if (data.jumlah > invoice.sisa_tagihan) {
        throw new Error(`Jumlah pembayaran (${data.jumlah}) melebihi sisa tagihan (${invoice.sisa_tagihan})`)
    }

    // Create kuitansi
    const { data: kuitansi, error } = await supabase
        .from('kuitansi')
        .insert({
            ...data,
            keterangan: `Pembayaran invoice no: ${invoice.no_invoice}`,
            created_by: user?.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating kuitansi:', error)
        throw new Error('Failed to create kuitansi')
    }

    // Note: Invoice payment status is auto-updated via database trigger

    revalidatePath('/kuitansi')
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${data.invoice_id}`)

    return kuitansi
}

/**
 * Delete kuitansi
 */
export async function deleteKuitansi(id: string): Promise<boolean> {
    const supabase = await createClient()

    // Get invoice_id before delete for revalidation
    const { data: kuitansi } = await supabase
        .from('kuitansi')
        .select('invoice_id')
        .eq('id', id)
        .single()

    const { error } = await supabase
        .from('kuitansi')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting kuitansi:', error)
        throw new Error('Failed to delete kuitansi')
    }

    // Note: Invoice payment status is auto-updated via database trigger

    revalidatePath('/kuitansi')
    revalidatePath('/invoices')
    if (kuitansi?.invoice_id) {
        revalidatePath(`/invoices/${kuitansi.invoice_id}`)
    }

    return true
}

/**
 * Get total payments for date range
 */
export async function getTotalPayments(dateFrom?: string, dateTo?: string): Promise<number> {
    const supabase = await createClient()

    let query = supabase
        .from('kuitansi')
        .select('jumlah')

    if (dateFrom) {
        query = query.gte('tanggal', dateFrom)
    }

    if (dateTo) {
        query = query.lte('tanggal', dateTo)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error getting total payments:', error)
        return 0
    }

    return data?.reduce((sum, k) => sum + k.jumlah, 0) || 0
}
