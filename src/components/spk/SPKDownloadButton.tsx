'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Order, Customer, Brand } from '@/types/database'
import SPKPDF from './SPKPDF'

interface OrderWithCustomer extends Order {
    customer: Customer
    brand?: Brand | null
}

interface SPKDownloadButtonProps {
    order: OrderWithCustomer
}

export default function SPKDownloadButton({ order }: SPKDownloadButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            // Pass brand info to SPKPDF
            const blob = await pdf(
                <SPKPDF
                    order={order}
                    brand={order.brand || undefined}
                />
            ).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `SPK-${order.nama_po || order.spk_number || order.customer?.name || 'Draft'}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
            {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )}
            {loading ? 'Loading...' : 'Print SPK'}
        </button>
    )
}
