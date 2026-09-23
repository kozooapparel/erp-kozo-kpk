'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { getKuitansiById } from '@/lib/actions/kuitansi'
import { toast } from 'sonner'
import { PdfPreviewModal } from '@/components/ui'
import { KuitansiPDFDocument } from './KuitansiPDF'

export default function KuitansiPreviewButton({ kuitansiId }: { kuitansiId: string }) {
    const [loading, setLoading] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    const handlePreview = async () => {
        setLoading(true)
        try {
            const kuitansi = await getKuitansiById(kuitansiId)
            if (!kuitansi) {
                toast.error('Kuitansi tidak ditemukan')
                return
            }

            const brand = kuitansi.invoice?.brand
            const blob = await pdf(
                <KuitansiPDFDocument
                    kuitansi={kuitansi}
                    companyInfo={brand ? {
                        name: brand.company_name,
                        address: brand.address || '',
                        phone: brand.phone || '',
                        primary_color: brand.primary_color,
                        accent_color: brand.accent_color,
                        default_kuitansi_template_id: brand.default_kuitansi_template_id
                    } : undefined}
                />
            ).toBlob()
            setPdfUrl(URL.createObjectURL(blob))
        } catch (error) {
            console.error('Error generating PDF preview:', error)
            toast.error('Gagal menampilkan PDF')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
    }

    return (
        <>
            <button
                onClick={handlePreview}
                disabled={loading}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                title="Lihat PDF"
                aria-label="Lihat PDF kuitansi"
            >
                {loading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
            </button>
            <PdfPreviewModal isOpen={Boolean(pdfUrl)} pdfUrl={pdfUrl} title="Preview Kuitansi" onClose={handleClose} />
        </>
    )
}
