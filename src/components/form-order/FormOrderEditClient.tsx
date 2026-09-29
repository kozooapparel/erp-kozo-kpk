'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { OrderWithCustomer, ProductionSpecs } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import FormOrderEditor from './FormOrderEditor'
import FormOrderDownloadButton from './FormOrderDownloadButton'
import FormOrderPreviewButton from './FormOrderPreviewButton'

interface FormOrderEditClientProps {
    order: OrderWithCustomer
}

export default function FormOrderEditClient({ order }: FormOrderEditClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const handleSave = async (data: { production_specs: ProductionSpecs }) => {
        try {
            setLoading(true)
            const specs = data.production_specs
            // Samakan perilaku dengan detail order di Kanban: total_quantity ikut
            // diperbarui dari jumlah produksi form order.
            const totalQty = specs.jumlah_produksi || 0
            const payload: Record<string, unknown> = {
                production_specs: specs,
                total_quantity: totalQty > 0 ? totalQty : order.total_quantity,
            }
            if (order.nama_po) payload.nama_po = order.nama_po

            const { error } = await supabase
                .from('orders')
                .update(payload)
                .eq('id', order.id)

            if (error) throw error

            toast.success('Form order berhasil disimpan!')
            router.push('/form-order')
            router.refresh()
        } catch (err) {
            console.error('Save form order error:', err)
            const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui'
            toast.error(`Gagal menyimpan form order: ${message}`)
            throw err
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        href="/form-order"
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        title="Kembali"
                        aria-label="Kembali ke daftar form order"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Detail / Edit Form Order</h1>
                        <p className="text-sm text-slate-500">
                            {order.spk_number || 'Draft'} · {order.customer?.name || '-'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FormOrderPreviewButton order={order} />
                    <FormOrderDownloadButton order={order} variant="icon" />
                </div>
            </div>

            <FormOrderEditor order={order} onSave={handleSave} isLoading={loading} />
        </div>
    )
}
