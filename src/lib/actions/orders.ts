'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Verify DP payment and auto-create kuitansi if invoice exists
 */
export async function verifyDPPayment(
    orderId: string,
    type: 'dp_desain' | 'dp_produksi' | 'pelunasan',
    amount?: number
): Promise<{ success: boolean; message: string; kuitansiCreated?: boolean }> {
    const supabase = await createClient()

    try {
        // Get order with invoice
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, invoices(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found')
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {
            [`${type}_verified`]: true,
            [`${type}_verified_at`]: new Date().toISOString(),
        }

        // If amount provided, update the amount too
        if (amount !== undefined && amount > 0) {
            updateData[`${type}_amount`] = amount
        }

        // Update order
        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)

        if (updateError) throw updateError

        // Check if invoice exists for this order to create kuitansi
        const { data: invoices } = await supabase
            .from('invoices')
            .select('id, no_invoice, sisa_tagihan')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)

        let kuitansiCreated = false
        const invoice = invoices?.[0]

        // Only create kuitansi if invoice exists
        if (invoice) {
            const paymentAmount = amount || order[`${type}_amount`] || 0

            if (paymentAmount > 0) {
                // Create kuitansi
                const { data: { user } } = await supabase.auth.getUser()

                const keterangan = type === 'dp_desain'
                    ? 'Pembayaran DP Desain'
                    : type === 'dp_produksi'
                        ? 'Pembayaran DP Produksi'
                        : 'Pembayaran Pelunasan'

                const { error: kuitansiError } = await supabase
                    .from('kuitansi')
                    .insert({
                        invoice_id: invoice.id,
                        tanggal: new Date().toISOString().split('T')[0],
                        jumlah: paymentAmount,
                        keterangan: `${keterangan} - ${invoice.no_invoice}`,
                        created_by: user?.id
                    })

                if (!kuitansiError) {
                    kuitansiCreated = true
                }
            }
        }

        revalidatePath('/')
        revalidatePath('/kuitansi')
        revalidatePath('/invoices')

        return {
            success: true,
            message: kuitansiCreated
                ? 'DP verified dan kuitansi otomatis dibuat'
                : 'DP verified (kuitansi akan dibuat setelah invoice ada)',
            kuitansiCreated
        }

    } catch (err) {
        console.error('Verify DP error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Gagal verify DP'
        }
    }
}

/**
 * Generate SPK number for an order
 */
export async function generateSPKNumber(orderId: string): Promise<{ success: boolean; spkNumber?: string; message: string }> {
    const supabase = await createClient()

    try {
        // Get order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, spk_number')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found')
        }

        // Already has SPK
        if (order.spk_number) {
            return {
                success: true,
                spkNumber: order.spk_number,
                message: 'SPK sudah ada'
            }
        }

        // Generate SPK number: SPK-YYYYMM-XXXX
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

        // Get last SPK of this month
        const { data: lastOrder } = await supabase
            .from('orders')
            .select('spk_number')
            .like('spk_number', `SPK-${yearMonth}-%`)
            .order('spk_number', { ascending: false })
            .limit(1)
            .single()

        let nextNumber = 1
        if (lastOrder?.spk_number) {
            const lastNum = parseInt(lastOrder.spk_number.split('-')[2]) || 0
            nextNumber = lastNum + 1
        }

        const spkNumber = `SPK-${yearMonth}-${String(nextNumber).padStart(4, '0')}`

        // Update order with SPK number
        const { error: updateError } = await supabase
            .from('orders')
            .update({ spk_number: spkNumber })
            .eq('id', orderId)

        if (updateError) throw updateError

        revalidatePath('/')
        revalidatePath('/spk')

        return {
            success: true,
            spkNumber,
            message: 'SPK berhasil di-generate'
        }

    } catch (err) {
        console.error('Generate SPK error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Gagal generate SPK'
        }
    }
}

/**
 * Move order to next stage with validations and auto-actions
 */
export async function moveOrderToNextStage(
    orderId: string,
    currentStage: string,
    nextStage: string
): Promise<{ success: boolean; message: string; spkGenerated?: boolean }> {
    const supabase = await createClient()

    try {
        // Get order with related data
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found')
        }

        // Validate based on current stage
        if (currentStage === 'dp_produksi') {
            // Check if invoice exists
            const { data: invoices } = await supabase
                .from('invoices')
                .select('id')
                .eq('order_id', orderId)

            if (!invoices || invoices.length === 0) {
                return {
                    success: false,
                    message: 'Buat Invoice terlebih dahulu sebelum pindah ke Antrean Produksi'
                }
            }

            if (!order.dp_produksi_verified) {
                return {
                    success: false,
                    message: 'DP Produksi harus diverifikasi terlebih dahulu'
                }
            }
        }

        // Update stage
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                stage: nextStage,
                stage_entered_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (updateError) throw updateError

        let spkGenerated = false

        // Auto-generate SPK when entering antrean_produksi
        if (nextStage === 'antrean_produksi' && !order.spk_number) {
            const result = await generateSPKNumber(orderId)
            spkGenerated = result.success
        }

        revalidatePath('/')

        return {
            success: true,
            message: spkGenerated
                ? 'Berhasil pindah stage dan SPK auto-generated'
                : 'Berhasil pindah stage',
            spkGenerated
        }

    } catch (err) {
        console.error('Move stage error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Gagal pindah stage'
        }
    }
}
