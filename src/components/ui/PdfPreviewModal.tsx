'use client'

import { useEffect } from 'react'

interface PdfPreviewModalProps {
    isOpen: boolean
    pdfUrl: string | null
    title: string
    onClose: () => void
}

export default function PdfPreviewModal({ isOpen, pdfUrl, title, onClose }: PdfPreviewModalProps) {
    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        }
    }, [pdfUrl])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/70 p-3 sm:p-6">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Tutup preview PDF"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="min-h-0 flex-1 bg-slate-100">
                    {pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            title={title}
                            className="h-full w-full"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
