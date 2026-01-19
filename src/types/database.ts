export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            customers: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    alamat: string | null
                    kota: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    alamat?: string | null
                    kota?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    alamat?: string | null
                    kota?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    customer_id: string
                    total_quantity: number
                    order_description: string | null
                    mockup_url: string | null
                    deadline: string | null
                    stage: OrderStage
                    dp_desain_amount: number
                    dp_desain_verified: boolean
                    dp_desain_proof_url: string | null
                    dp_desain_verified_at: string | null
                    dp_desain_verified_by: string | null
                    dp_produksi_amount: number
                    dp_produksi_verified: boolean
                    dp_produksi_proof_url: string | null
                    dp_produksi_verified_at: string | null
                    dp_produksi_verified_by: string | null
                    pelunasan_amount: number
                    pelunasan_verified: boolean
                    pelunasan_proof_url: string | null
                    pelunasan_verified_at: string | null
                    pelunasan_verified_by: string | null
                    tracking_number: string | null
                    shipped_at: string | null
                    stage_entered_at: string
                    payment_proof_url: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                    // Stage completion tracking
                    layout_completed: boolean
                    layout_completed_at: string | null
                    production_ready: boolean
                    production_ready_at: string | null
                    print_completed: boolean
                    print_completed_at: string | null
                    sewing_completed: boolean
                    sewing_completed_at: string | null
                    packing_completed: boolean
                    packing_completed_at: string | null
                }
                Insert: {
                    id?: string
                    customer_id: string
                    total_quantity: number
                    order_description?: string | null
                    mockup_url?: string | null
                    deadline?: string | null
                    stage?: OrderStage
                    dp_desain_amount?: number
                    dp_desain_verified?: boolean
                    dp_desain_proof_url?: string | null
                    dp_produksi_amount?: number
                    dp_produksi_verified?: boolean
                    dp_produksi_proof_url?: string | null
                    pelunasan_amount?: number
                    pelunasan_verified?: boolean
                    pelunasan_proof_url?: string | null
                    tracking_number?: string | null
                    stage_entered_at?: string
                    created_by?: string | null
                    // Stage completion tracking
                    layout_completed?: boolean
                    production_ready?: boolean
                    print_completed?: boolean
                    sewing_completed?: boolean
                    packing_completed?: boolean
                }
                Update: {
                    id?: string
                    customer_id?: string
                    total_quantity?: number
                    order_description?: string | null
                    mockup_url?: string | null
                    deadline?: string | null
                    stage?: OrderStage
                    dp_desain_amount?: number
                    dp_desain_verified?: boolean
                    dp_desain_proof_url?: string | null
                    dp_produksi_amount?: number
                    dp_produksi_verified?: boolean
                    dp_produksi_proof_url?: string | null
                    pelunasan_amount?: number
                    pelunasan_verified?: boolean
                    pelunasan_proof_url?: string | null
                    tracking_number?: string | null
                    shipped_at?: string | null
                    stage_entered_at?: string
                    payment_proof_url?: string | null
                    // Stage completion tracking
                    layout_completed?: boolean
                    layout_completed_at?: string | null
                    production_ready?: boolean
                    production_ready_at?: string | null
                    print_completed?: boolean
                    print_completed_at?: string | null
                    sewing_completed?: boolean
                    sewing_completed_at?: string | null
                    packing_completed?: boolean
                    packing_completed_at?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    role: 'owner' | 'admin'
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    role?: 'owner' | 'admin'
                    avatar_url?: string | null
                }
                Update: {
                    email?: string
                    full_name?: string
                    role?: 'owner' | 'admin'
                    avatar_url?: string | null
                }
            }
            // ==========================================
            // INVOICE SYSTEM TABLES
            // ==========================================
            barang: {
                Row: {
                    id: string
                    nama_barang: string
                    satuan: string
                    harga_satuan: number
                    kategori: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nama_barang: string
                    satuan?: string
                    harga_satuan?: number
                    kategori?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nama_barang?: string
                    satuan?: string
                    harga_satuan?: number
                    kategori?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            barang_harga_tier: {
                Row: {
                    id: string
                    barang_id: string
                    min_qty: number
                    max_qty: number | null
                    harga: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    barang_id: string
                    min_qty: number
                    max_qty?: number | null
                    harga: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    barang_id?: string
                    min_qty?: number
                    max_qty?: number | null
                    harga?: number
                    created_at?: string
                }
            }
            invoices: {
                Row: {
                    id: string
                    no_invoice: string
                    tanggal: string
                    customer_id: string
                    order_id: string | null
                    perkiraan_produksi: number | null
                    deadline: string | null
                    termin_pembayaran: number
                    no_po: string | null
                    sub_total: number
                    ppn_persen: number
                    ppn_amount: number
                    total: number
                    total_dibayar: number
                    sisa_tagihan: number
                    status_pembayaran: 'BELUM_LUNAS' | 'SUDAH_LUNAS'
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    no_invoice: string
                    tanggal?: string
                    customer_id: string
                    order_id?: string | null
                    perkiraan_produksi?: number | null
                    deadline?: string | null
                    termin_pembayaran?: number
                    no_po?: string | null
                    sub_total?: number
                    ppn_persen?: number
                    ppn_amount?: number
                    total?: number
                    total_dibayar?: number
                    sisa_tagihan?: number
                    status_pembayaran?: 'BELUM_LUNAS' | 'SUDAH_LUNAS'
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    no_invoice?: string
                    tanggal?: string
                    customer_id?: string
                    order_id?: string | null
                    perkiraan_produksi?: number | null
                    deadline?: string | null
                    termin_pembayaran?: number
                    no_po?: string | null
                    sub_total?: number
                    ppn_persen?: number
                    ppn_amount?: number
                    total?: number
                    total_dibayar?: number
                    sisa_tagihan?: number
                    status_pembayaran?: 'BELUM_LUNAS' | 'SUDAH_LUNAS'
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            invoice_items: {
                Row: {
                    id: string
                    invoice_id: string
                    item_no: number
                    barang_id: string | null
                    deskripsi: string
                    jumlah: number
                    satuan: string
                    harga_satuan: number
                    sub_total: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    invoice_id: string
                    item_no: number
                    barang_id?: string | null
                    deskripsi: string
                    jumlah: number
                    satuan?: string
                    harga_satuan: number
                    sub_total: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    invoice_id?: string
                    item_no?: number
                    barang_id?: string | null
                    deskripsi?: string
                    jumlah?: number
                    satuan?: string
                    harga_satuan?: number
                    sub_total?: number
                    created_at?: string
                }
            }
            kuitansi: {
                Row: {
                    id: string
                    no_kuitansi: number
                    tanggal: string
                    invoice_id: string
                    jumlah: number
                    keterangan: string | null
                    lokasi: string
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    no_kuitansi?: number
                    tanggal?: string
                    invoice_id: string
                    jumlah: number
                    keterangan?: string | null
                    lokasi?: string
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    no_kuitansi?: number
                    tanggal?: string
                    invoice_id?: string
                    jumlah?: number
                    keterangan?: string | null
                    lokasi?: string
                    created_by?: string | null
                    created_at?: string
                }
            }
            app_settings: {
                Row: {
                    id: string
                    key: string
                    value: Json
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: Json
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: Json
                    updated_at?: string
                }
            }
        }
        Views: {
            dashboard_metrics: {
                Row: {
                    total_active_orders: number
                    total_unpaid_orders: number
                    total_receivables: number
                    bottleneck_count: number
                }
            }
            bottleneck_orders: {
                Row: {
                    id: string
                    customer_id: string
                    customer_name: string
                    customer_phone: string
                    days_in_stage: number
                }
            }
        }
        Functions: {}
        Enums: {}
    }
}

// 10-Stage Kanban Types (updated)
export type OrderStage =
    | 'customer_dp_desain'   // 1. Customer DP Desain
    | 'proses_desain'        // 2. Proses Desain
    | 'proses_layout'        // 3. Proses Layout (NEW)
    | 'dp_produksi'          // 4. DP Produksi (Gatekeeper - 50%)
    | 'antrean_produksi'     // 5. Antrean Produksi
    | 'print_press'          // 6. Print & Press
    | 'cutting_jahit'        // 7. Cutting & Jahit
    | 'packing'              // 8. Packing
    | 'pelunasan'            // 9. Pelunasan (Gatekeeper - Full payment)
    | 'pengiriman'           // 10. Pengiriman

export const STAGE_LABELS: Record<OrderStage, string> = {
    customer_dp_desain: 'Customer DP Desain',
    proses_desain: 'Proses Desain',
    proses_layout: 'Proses Layout',
    dp_produksi: 'DP Produksi',
    antrean_produksi: 'Antrean Produksi',
    print_press: 'Print & Press',
    cutting_jahit: 'Cutting & Jahit',
    packing: 'Packing',
    pelunasan: 'Pelunasan',
    pengiriman: 'Pengiriman',
}

export const STAGES_ORDER: OrderStage[] = [
    'customer_dp_desain',
    'proses_desain',
    'proses_layout',
    'dp_produksi',
    'antrean_produksi',
    'print_press',
    'cutting_jahit',
    'packing',
    'pelunasan',
    'pengiriman',
]

// Gatekeeper stages - require payment verification
export const GATEKEEPER_STAGES: OrderStage[] = ['dp_produksi', 'pelunasan']

// Per-stage bottleneck threshold (in days)
// Proses Desain & Layout: 1 hari (critical - impacts entire timeline)
// Other stages: 2 hari
export const STAGE_BOTTLENECK_DAYS: Record<OrderStage, number> = {
    customer_dp_desain: 2,
    proses_desain: 1,      // ⚡ Critical - 1 hari
    proses_layout: 1,      // ⚡ Critical - 1 hari
    dp_produksi: 2,
    antrean_produksi: 2,
    print_press: 2,
    cutting_jahit: 2,
    packing: 2,
    pelunasan: 2,
    pengiriman: 2,
}

// Type aliases for convenience
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type DashboardMetrics = Database['public']['Views']['dashboard_metrics']['Row']

// Invoice System Type Aliases
export type Barang = Database['public']['Tables']['barang']['Row']
export type BarangInsert = Database['public']['Tables']['barang']['Insert']
export type BarangUpdate = Database['public']['Tables']['barang']['Update']
export type BarangHargaTier = Database['public']['Tables']['barang_harga_tier']['Row']
export type BarangHargaTierInsert = Database['public']['Tables']['barang_harga_tier']['Insert']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert']
export type Kuitansi = Database['public']['Tables']['kuitansi']['Row']
export type KuitansiInsert = Database['public']['Tables']['kuitansi']['Insert']
export type AppSettings = Database['public']['Tables']['app_settings']['Row']

// Extended types with relations
export interface InvoiceWithCustomer extends Invoice {
    customer: Customer
}

export interface InvoiceWithItems extends Invoice {
    customer: Customer
    items: InvoiceItem[]
}

export interface KuitansiWithInvoice extends Kuitansi {
    invoice: InvoiceWithCustomer
}

export interface BarangWithTiers extends Barang {
    harga_tiers: BarangHargaTier[]
}

// Payment Status Type
export type PaymentStatus = 'BELUM_LUNAS' | 'SUDAH_LUNAS'
