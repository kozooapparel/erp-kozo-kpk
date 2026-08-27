// Script to insert dummy data for testing bottleneck
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertDummyData() {
    console.log('Starting dummy data insertion...')

    // 1. Insert customers
    const customers = [
        { name: 'PT Cahaya Terang', phone: '081234567890' },
        { name: 'CV Maju Bersama', phone: '082345678901' },
        { name: 'Toko Sinar Jaya', phone: '083456789012' },
        { name: 'UD Berkah Abadi', phone: '084567890123' },
        { name: 'PT Sukses Mandiri', phone: '085678901234' },
        { name: 'CV Karya Utama', phone: '086789012345' },
        { name: 'Toko Harapan Kita', phone: '087890123456' },
        { name: 'UD Prima Jaya', phone: '088901234567' },
        { name: 'PT Global Indonesia', phone: '089012345678' },
        { name: 'CV Mitra Sejahtera', phone: '081122334455' },
    ]

    const { data: insertedCustomers, error: custError } = await supabase
        .from('customers')
        .upsert(customers, { onConflict: 'phone' })
        .select()

    if (custError) {
        console.error('Customer insert error:', custError)
        return
    }
    console.log('Inserted customers:', insertedCustomers?.length || 0)

    // Get all customers
    const { data: allCustomers } = await supabase.from('customers').select('id, name, phone')
    console.log('Total customers:', allCustomers?.length)

    // 2. Insert orders across different stages with 5 in 'jahit'
    const now = new Date()
    const days = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()

    const orders = [
        // customer_dp_desain (1)
        { customer_id: allCustomers[0]?.id, order_description: 'Jersey Futsal Tim A', total_quantity: 50, stage: 'customer_dp_desain', deadline: days(14), dp_desain_amount: 500000, stage_entered_at: now.toISOString() },

        // proses_desain (1)
        { customer_id: allCustomers[1]?.id, order_description: 'Kaos Event Kantor', total_quantity: 100, stage: 'proses_desain', deadline: days(10), dp_desain_amount: 1000000, dp_desain_verified: true, stage_entered_at: now.toISOString() },

        // dp_produksi (1)
        { customer_id: allCustomers[2]?.id, order_description: 'Jersey Basket SMA', total_quantity: 30, stage: 'dp_produksi', deadline: days(7), dp_desain_amount: 300000, dp_desain_verified: true, stage_entered_at: now.toISOString() },

        // antrean_produksi (2)
        { customer_id: allCustomers[3]?.id, order_description: 'Polo Shirt Perusahaan', total_quantity: 75, stage: 'antrean_produksi', deadline: days(12), dp_desain_amount: 750000, dp_desain_verified: true, dp_produksi_amount: 1500000, dp_produksi_verified: true, stage_entered_at: now.toISOString() },
        { customer_id: allCustomers[4]?.id, order_description: 'Jersey Bola Desa', total_quantity: 40, stage: 'antrean_produksi', deadline: days(9), dp_desain_amount: 400000, dp_desain_verified: true, dp_produksi_amount: 800000, dp_produksi_verified: true, stage_entered_at: now.toISOString() },

        // jahit (5 - BOTTLENECK TEST!)
        { customer_id: allCustomers[5]?.id, order_description: 'Jersey Marathon', total_quantity: 200, stage: 'jahit', deadline: days(5), dp_desain_amount: 2000000, dp_desain_verified: true, dp_produksi_amount: 4000000, dp_produksi_verified: true, stage_entered_at: daysAgo(3) },
        { customer_id: allCustomers[6]?.id, order_description: 'Kaos Oblong Custom', total_quantity: 150, stage: 'jahit', deadline: days(6), dp_desain_amount: 1500000, dp_desain_verified: true, dp_produksi_amount: 3000000, dp_produksi_verified: true, stage_entered_at: daysAgo(2) },
        { customer_id: allCustomers[7]?.id, order_description: 'Jersey Voli Tim', total_quantity: 60, stage: 'jahit', deadline: days(4), dp_desain_amount: 600000, dp_desain_verified: true, dp_produksi_amount: 1200000, dp_produksi_verified: true, stage_entered_at: daysAgo(4) },
        { customer_id: allCustomers[8]?.id, order_description: 'Polo Seragam Kantor', total_quantity: 80, stage: 'jahit', deadline: days(8), dp_desain_amount: 800000, dp_desain_verified: true, dp_produksi_amount: 1600000, dp_produksi_verified: true, stage_entered_at: daysAgo(1) },
        { customer_id: allCustomers[9]?.id, order_description: 'Jersey E-Sport', total_quantity: 25, stage: 'jahit', deadline: days(3), dp_desain_amount: 250000, dp_desain_verified: true, dp_produksi_amount: 500000, dp_produksi_verified: true, stage_entered_at: daysAgo(5) },

        // print_press (1)
        { customer_id: allCustomers[0]?.id, order_description: 'Kaos Komunitas Hiking', total_quantity: 45, stage: 'print_press', deadline: days(11), dp_desain_amount: 450000, dp_desain_verified: true, dp_produksi_amount: 900000, dp_produksi_verified: true, stage_entered_at: now.toISOString() },
    ]

    const { data: insertedOrders, error: ordError } = await supabase
        .from('orders')
        .insert(orders)
        .select()

    if (ordError) {
        console.error('Order insert error:', ordError)
        return
    }

    console.log('Inserted orders:', insertedOrders?.length || 0)
    console.log('Done! Refresh dashboard to see bottleneck alert on Jahit column.')
}

insertDummyData()
