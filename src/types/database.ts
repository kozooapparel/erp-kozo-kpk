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
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
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

// 9-Stage Kanban Types (updated)
export type OrderStage =
    | 'customer_dp_desain'   // 1. Customer DP Desain
    | 'proses_desain'        // 2. Proses Desain
    | 'dp_produksi'          // 3. DP Produksi (Gatekeeper - 50%)
    | 'antrean_produksi'     // 4. Antrean Produksi
    | 'print_press'          // 5. Print & Press
    | 'cutting_jahit'        // 6. Cutting & Jahit
    | 'packing'              // 7. Packing
    | 'pelunasan'            // 8. Pelunasan (Gatekeeper - Full payment)
    | 'pengiriman'           // 9. Pengiriman

export const STAGE_LABELS: Record<OrderStage, string> = {
    customer_dp_desain: 'Customer DP Desain',
    proses_desain: 'Proses Desain',
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
// Proses Desain: 1 hari (critical - impacts entire timeline)
// Other stages: 2 hari
export const STAGE_BOTTLENECK_DAYS: Record<OrderStage, number> = {
    customer_dp_desain: 2,
    proses_desain: 1,      // ⚡ Critical - 1 hari
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
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type DashboardMetrics = Database['public']['Views']['dashboard_metrics']['Row']
