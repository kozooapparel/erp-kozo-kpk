'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Delete a customer - only allowed if customer has no orders
 */
export async function deleteCustomer(customerId: string): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient()

    try {
        // Check if customer has any orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_id', customerId)
            .limit(1)

        if (ordersError) throw ordersError

        // If customer has orders, reject deletion
        if (orders && orders.length > 0) {
            return {
                success: false,
                message: 'Tidak bisa hapus customer yang memiliki order. Hapus order terlebih dahulu.'
            }
        }

        // Check if customer has any invoices (direct invoices without orders)
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('id')
            .eq('customer_id', customerId)
            .limit(1)

        if (invoicesError) throw invoicesError

        if (invoices && invoices.length > 0) {
            return {
                success: false,
                message: 'Tidak bisa hapus customer yang memiliki invoice. Hapus invoice terlebih dahulu.'
            }
        }

        // Delete the customer
        const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .eq('id', customerId)

        if (deleteError) throw deleteError

        revalidatePath('/customers')
        revalidatePath('/dashboard')

        return {
            success: true,
            message: 'Customer berhasil dihapus'
        }

    } catch (err) {
        console.error('Delete customer error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Gagal menghapus customer'
        }
    }
}
