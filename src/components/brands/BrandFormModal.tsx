'use client'

import { useState, useEffect } from 'react'
import { Brand, BrandInsert, BrandUpdate } from '@/types/database'
import { createBrand, updateBrand } from '@/lib/actions/brands'
import { useRouter } from 'next/navigation'

interface BrandFormModalProps {
    isOpen: boolean
    onClose: () => void
    brand?: Brand  // If provided, we're editing
}

export default function BrandFormModal({ isOpen, onClose, brand }: BrandFormModalProps) {
    const isEditing = !!brand
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        company_name: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
        bank_name: '',
        account_name: '',
        account_number: '',
        invoice_prefix: '',
        kuitansi_prefix: '',
        spk_prefix: '',
        primary_color: '#1e293b',
        accent_color: '#f97316',
    })

    // Update form data when brand prop changes
    useEffect(() => {
        if (brand) {
            setFormData({
                code: brand.code || '',
                name: brand.name || '',
                company_name: brand.company_name || '',
                address: brand.address || '',
                phone: brand.phone || '',
                email: brand.email || '',
                logo_url: brand.logo_url || '',
                bank_name: brand.bank_name || '',
                account_name: brand.account_name || '',
                account_number: brand.account_number || '',
                invoice_prefix: brand.invoice_prefix || '',
                kuitansi_prefix: brand.kuitansi_prefix || '',
                spk_prefix: brand.spk_prefix || '',
                primary_color: brand.primary_color || '#1e293b',
                accent_color: brand.accent_color || '#f97316',
            })
        } else {
            // Reset form for new brand
            setFormData({
                code: '',
                name: '',
                company_name: '',
                address: '',
                phone: '',
                email: '',
                logo_url: '',
                bank_name: '',
                account_name: '',
                account_number: '',
                invoice_prefix: '',
                kuitansi_prefix: '',
                spk_prefix: '',
                primary_color: '#1e293b',
                accent_color: '#f97316',
            })
        }
        setError(null)
    }, [brand])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Auto-generate prefixes from code if empty
            const data = {
                ...formData,
                invoice_prefix: formData.invoice_prefix || formData.code.toUpperCase(),
                kuitansi_prefix: formData.kuitansi_prefix || formData.code.toUpperCase(),
                spk_prefix: formData.spk_prefix || `SPK-${formData.code.toUpperCase()}`,
            }

            if (isEditing && brand) {
                await updateBrand(brand.id, data)
            } else {
                await createBrand(data as BrandInsert)
            }

            onClose()
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl m-4">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900">
                        {isEditing ? 'Edit Brand' : 'Tambah Brand Baru'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                            Informasi Dasar
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kode Brand *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    maxLength={5}
                                    placeholder="KZO"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <p className="text-xs text-slate-400 mt-1">Max 5 karakter, huruf kapital</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Brand *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Kozoo Apparel"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                URL Logo
                            </label>
                            <input
                                type="url"
                                name="logo_url"
                                value={formData.logo_url}
                                onChange={handleChange}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            {formData.logo_url && (
                                <div className="mt-2 p-2 bg-slate-50 rounded-lg inline-block">
                                    <img
                                        src={formData.logo_url}
                                        alt="Preview"
                                        className="h-12 object-contain"
                                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">2</span>
                            Informasi Perusahaan
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Nama Perusahaan *
                            </label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                required
                                placeholder="PT. Kozoo Apparel Indonesia"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Alamat
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Telepon
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0812-3456-7890"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="info@example.com"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">3</span>
                            Informasi Bank
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Bank
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleChange}
                                    placeholder="BCA"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Atas Nama
                                </label>
                                <input
                                    type="text"
                                    name="account_name"
                                    value={formData.account_name}
                                    onChange={handleChange}
                                    placeholder="Nama Akun"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    No. Rekening
                                </label>
                                <input
                                    type="text"
                                    name="account_number"
                                    value={formData.account_number}
                                    onChange={handleChange}
                                    placeholder="1234567890"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Document Prefixes */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">4</span>
                            Prefix Dokumen
                        </h3>
                        <p className="text-xs text-slate-500">Kosongkan untuk menggunakan kode brand sebagai prefix</p>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Invoice Prefix
                                </label>
                                <input
                                    type="text"
                                    name="invoice_prefix"
                                    value={formData.invoice_prefix}
                                    onChange={handleChange}
                                    placeholder={formData.code.toUpperCase() || 'KZO'}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <p className="text-xs text-slate-400 mt-1">Contoh: {formData.invoice_prefix || formData.code.toUpperCase() || 'KZO'}/260121/CUST</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kuitansi Prefix
                                </label>
                                <input
                                    type="text"
                                    name="kuitansi_prefix"
                                    value={formData.kuitansi_prefix}
                                    onChange={handleChange}
                                    placeholder={formData.code.toUpperCase() || 'KZO'}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <p className="text-xs text-slate-400 mt-1">Contoh: {formData.kuitansi_prefix || formData.code.toUpperCase() || 'KZO'}-001</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    SPK Prefix
                                </label>
                                <input
                                    type="text"
                                    name="spk_prefix"
                                    value={formData.spk_prefix}
                                    onChange={handleChange}
                                    placeholder={`SPK-${formData.code.toUpperCase()}` || 'SPK-KZO'}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <p className="text-xs text-slate-400 mt-1">Contoh: {formData.spk_prefix || `SPK-${formData.code.toUpperCase()}` || 'SPK-KZO'}-001</p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="inline-flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Menyimpan...
                                </span>
                            ) : (
                                isEditing ? 'Simpan Perubahan' : 'Tambah Brand'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
