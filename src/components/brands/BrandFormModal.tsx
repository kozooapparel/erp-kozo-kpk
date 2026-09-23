'use client'

import { useState, useEffect, useRef } from 'react'
import { Brand, BrandInsert, BrandUpdate } from '@/types/database'
import { createBrand, updateBrand } from '@/lib/actions/brands'
import { createClient } from '@/lib/supabase/client'
import { resizeImageToSquare } from '@/lib/utils/image'
import { toast } from 'sonner'

interface BrandFormModalProps {
    isOpen: boolean
    onClose: () => void
    brand?: Brand  // If provided, we're editing
    onBrandCreated?: (brand: Brand) => void
    onBrandUpdated?: (brand: Brand) => void
}

export default function BrandFormModal({ isOpen, onClose, brand, onBrandCreated, onBrandUpdated }: BrandFormModalProps) {
    const isEditing = !!brand

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const supabase = createClient()

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
        default_invoice_template_id: 'invoice_01' as 'invoice_01' | 'invoice_02' | 'invoice_03',
        default_kuitansi_template_id: 'receipt_01' as 'receipt_01' | 'receipt_02' | 'receipt_03',
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
                default_invoice_template_id: (brand.default_invoice_template_id || 'invoice_01') as 'invoice_01' | 'invoice_02' | 'invoice_03',
                default_kuitansi_template_id: (brand.default_kuitansi_template_id || 'receipt_01') as 'receipt_01' | 'receipt_02' | 'receipt_03',
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
                default_invoice_template_id: 'invoice_01' as const,
                default_kuitansi_template_id: 'receipt_01' as const,
            })
        }
        setError(null)
    }, [brand])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Upload logo: resize to 180x180 (lightweight), then store in Supabase Storage
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar')
            return
        }

        setUploading(true)
        setError(null)
        try {
            // Resize to 180x180 so the stored file stays small
            const resized = await resizeImageToSquare(file, 180)
            const fileName = `logo-${Date.now()}.png`

            const { error: uploadError } = await supabase.storage
                .from('brand-logos')
                .upload(fileName, resized, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('brand-logos')
                .getPublicUrl(fileName)

            setFormData(prev => ({ ...prev, logo_url: publicUrl }))
        } catch (err) {
            setError(err instanceof Error ? `Gagal upload logo: ${err.message}` : 'Gagal upload logo')
        } finally {
            setUploading(false)
            // Allow selecting the same file again
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
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
                const updated = await updateBrand(brand.id, data)
                onBrandUpdated?.(updated)
                toast.success('Pengaturan brand dan tampilan dokumen berhasil disimpan')
            } else {
                const created = await createBrand(data as BrandInsert)
                onBrandCreated?.(created)
                toast.success('Brand berhasil dibuat')
            }

            onClose()
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
                                    placeholder="Nama Brand Anda"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Logo
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="url"
                                    name="logo_url"
                                    value={formData.logo_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/logo.png"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Mengunggah...' : 'Upload'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Upload otomatis di-resize ke 180×180 px agar ringan
                            </p>
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
                                placeholder="Nama Perusahaan Anda"
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

                    {/* Document Appearance */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">5</span>
                            Tampilan Dokumen
                        </h3>
                        <p className="text-xs text-slate-500">Pilih layout yang akan digunakan saat PDF dibuat untuk brand ini.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Layout Invoice
                                <select name="default_invoice_template_id" value={formData.default_invoice_template_id} onChange={handleChange} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                    <option value="invoice_01">Modern — header berwarna</option>
                                    <option value="invoice_02">Minimal — bersih dan hemat tinta</option>
                                    <option value="invoice_03">Bold — identitas brand dominan</option>
                                </select>
                            </label>
                            <label className="block text-sm font-medium text-slate-700">
                                Layout Kuitansi
                                <select name="default_kuitansi_template_id" value={formData.default_kuitansi_template_id} onChange={handleChange} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                    <option value="receipt_01">Formal — pembayaran jelas</option>
                                    <option value="receipt_02">Minimal — sederhana</option>
                                    <option value="receipt_03">Compact — hemat ruang</option>
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Warna Utama
                                <input type="color" name="primary_color" value={formData.primary_color} onChange={handleChange} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white p-1" />
                            </label>
                            <label className="block text-sm font-medium text-slate-700">
                                Warna Aksen
                                <input type="color" name="accent_color" value={formData.accent_color} onChange={handleChange} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white p-1" />
                            </label>
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
