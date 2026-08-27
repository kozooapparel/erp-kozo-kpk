'use client'

import { useState } from 'react'
import { Brand } from '@/types/database'
import { deleteBrand, setDefaultBrand } from '@/lib/actions/brands'
import { useRouter } from 'next/navigation'
import BrandFormModal from './BrandFormModal'

interface BrandListProps {
    brands: Brand[]
}

export default function BrandList({ brands }: BrandListProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const router = useRouter()

    const handleSetDefault = async (id: string) => {
        setLoading(id)
        try {
            await setDefaultBrand(id)
            router.refresh()
        } catch (error) {
            console.error('Error setting default brand:', error)
        } finally {
            setLoading(null)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Yakin ingin menghapus brand "${name}"?`)) return

        setLoading(id)
        try {
            await deleteBrand(id)
            router.refresh()
        } catch (error) {
            console.error('Error deleting brand:', error)
            alert(error instanceof Error ? error.message : 'Error menghapus brand')
        } finally {
            setLoading(null)
        }
    }

    if (brands.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                Belum ada brand. Klik tombol "Tambah Brand" untuk menambahkan.
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => (
                    <div
                        key={brand.id}
                        className={`bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${brand.is_default ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
                            }`}
                    >
                        {/* Header with Logo */}
                        <div className="flex items-start gap-4 mb-4">
                            {brand.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="w-16 h-16 object-contain rounded-lg bg-slate-50 p-1"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-400">
                                        {brand.code}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-slate-900 truncate">
                                        {brand.name}
                                    </h3>
                                    {brand.is_default && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">Code: {brand.code}</p>
                            </div>
                        </div>

                        {/* Prefixes */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg">
                                INV: {brand.invoice_prefix}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg">
                                KWT: {brand.kuitansi_prefix}
                            </span>
                            <span className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-lg">
                                SPK: {brand.spk_prefix}
                            </span>
                        </div>

                        {/* Company Info */}
                        <div className="text-sm text-slate-600 mb-4 space-y-1">
                            <p className="font-medium">{brand.company_name}</p>
                            {brand.address && (
                                <p className="text-slate-400 text-xs line-clamp-2">{brand.address}</p>
                            )}
                            {brand.phone && (
                                <p className="text-slate-400 text-xs">📞 {brand.phone}</p>
                            )}
                        </div>

                        {/* Bank Info */}
                        {brand.bank_name && (
                            <div className="p-3 bg-slate-50 rounded-xl mb-4">
                                <p className="text-xs text-slate-500 mb-1">Bank Info</p>
                                <p className="text-sm font-medium">{brand.bank_name}</p>
                                <p className="text-xs text-slate-600">{brand.account_name}</p>
                                <p className="text-xs text-slate-600">{brand.account_number}</p>
                            </div>
                        )}

                        {/* Counters */}
                        <div className="flex gap-4 text-xs text-slate-400 mb-4 border-t pt-4">
                            <span>Invoice: #{brand.invoice_counter}</span>
                            <span>Kuitansi: #{brand.kuitansi_counter}</span>
                            <span>SPK: #{brand.spk_counter}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {!brand.is_default && (
                                <button
                                    onClick={() => handleSetDefault(brand.id)}
                                    disabled={loading === brand.id}
                                    className="flex-1 py-2 px-3 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Set Default
                                </button>
                            )}
                            <button
                                onClick={() => setEditingBrand(brand)}
                                className="flex-1 py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                            >
                                Edit
                            </button>
                            {!brand.is_default && (
                                <button
                                    onClick={() => handleDelete(brand.id, brand.name)}
                                    disabled={loading === brand.id}
                                    className="py-2 px-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            <BrandFormModal
                isOpen={editingBrand !== null}
                onClose={() => setEditingBrand(null)}
                brand={editingBrand || undefined}
            />
        </>
    )
}
