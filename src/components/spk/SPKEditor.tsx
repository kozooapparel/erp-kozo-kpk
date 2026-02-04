'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, Upload, X, Image as ImageIcon } from 'lucide-react'
import { SPKSection, ProductionSpecs, SizeRekapItem, PersonItem } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

// Simple ID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`


interface SPKEditorProps {
    orderId: string
    namaPo: string | null
    sections: SPKSection[]
    productionSpecs: ProductionSpecs | null
    productionNotes: string | null
    onSave: (data: {
        nama_po: string
        spk_sections: SPKSection[]
        production_specs: ProductionSpecs
        production_notes: string
    }) => Promise<void>
    isLoading?: boolean
}

type SectionFormat = 'simple' | 'rekap' | 'personalization'

const DEFAULT_PRODUCTION_SPECS: ProductionSpecs = {
    kerah: '',
    kerah_image_url: '',
    bahan: '',
    bahan_celana: '',
    kategori: '',
    bis: '',
    autentic: '',
    penjahit: '',
    need_atasan: true,
    need_celana: false,
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL', '6XL']
const SLEEVE_TYPES = ['Pendek', 'Panjang', 'Tanpa Lengan'] as const

export default function SPKEditor({
    orderId,
    namaPo,
    sections: initialSections,
    productionSpecs: initialSpecs,
    productionNotes: initialNotes,
    onSave,
    isLoading = false
}: SPKEditorProps) {
    const [namaPOValue, setNamaPOValue] = useState(namaPo || '')
    const [sections, setSections] = useState<SPKSection[]>(
        initialSections?.length > 0 ? initialSections : []
    )
    const [specs, setSpecs] = useState<ProductionSpecs>(
        initialSpecs || DEFAULT_PRODUCTION_SPECS
    )
    const [notes, setNotes] = useState(initialNotes || '')
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState<string | null>(null)

    const supabase = createClient()

    // Add new section
    const addSection = useCallback(() => {
        const newSection: SPKSection = {
            id: generateId(),
            title: `Section ${sections.length + 1}`,
            mockup_urls: [],
            size_breakdown: {},
        }
        setSections(prev => [...prev, newSection])
    }, [sections.length])

    // Remove section
    const removeSection = useCallback((sectionId: string) => {
        setSections(prev => prev.filter(s => s.id !== sectionId))
    }, [])

    // Update section
    const updateSection = useCallback((sectionId: string, updates: Partial<SPKSection>) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId ? { ...s, ...updates } : s
        ))
    }, [])

    // Get section format
    const getSectionFormat = (section: SPKSection): SectionFormat => {
        if (section.personalization_list && section.personalization_list.length > 0) {
            return 'personalization'
        }
        if (section.size_rekap && section.size_rekap.length > 0) {
            return 'rekap'
        }
        return 'simple'
    }

    // Change section format
    const changeSectionFormat = useCallback((sectionId: string, format: SectionFormat) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s

            // Reset data based on format
            const base = { ...s }
            if (format === 'simple') {
                return {
                    ...base,
                    size_breakdown: s.size_breakdown || {},
                    personalization_list: undefined,
                    size_rekap: undefined,
                }
            } else if (format === 'rekap') {
                return {
                    ...base,
                    size_rekap: s.size_rekap || [{ size: 'M', jumlah: 0, keterangan: '' }],
                    personalization_list: undefined,
                    size_breakdown: undefined,
                }
            } else {
                return {
                    ...base,
                    personalization_list: s.personalization_list || [{ name: '', size: 'M' }],
                    size_rekap: undefined,
                    size_breakdown: undefined,
                }
            }
        }))
    }, [])

    // Upload image
    const uploadImage = async (file: File, sectionId: string, type: 'mockup' | 'collar') => {
        setUploadingImage(`${sectionId}-${type}`)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${orderId}/${sectionId}/${type}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('spk-images')
                .upload(fileName, file)

            if (uploadError) {
                // Try to create bucket if it doesn't exist
                console.error('Upload error:', uploadError)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('spk-images')
                .getPublicUrl(fileName)

            if (type === 'mockup') {
                updateSection(sectionId, {
                    mockup_urls: [...(sections.find(s => s.id === sectionId)?.mockup_urls || []), publicUrl]
                })
            } else {
                updateSection(sectionId, { collar_image_url: publicUrl })
            }
        } catch (err) {
            console.error('Upload failed:', err)
        } finally {
            setUploadingImage(null)
        }
    }

    // Remove mockup image
    const removeMockupImage = useCallback((sectionId: string, imageUrl: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s
            return {
                ...s,
                mockup_urls: s.mockup_urls.filter(url => url !== imageUrl)
            }
        }))
    }, [])

    // Handle save
    const handleSave = async () => {
        setSaving(true)
        try {
            await onSave({
                nama_po: namaPOValue,
                spk_sections: sections,
                production_specs: specs,
                production_notes: notes,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl">
                <h2 className="text-lg font-bold">SPK Editor</h2>
                <p className="text-blue-100 text-sm">Surat Perintah Kerja</p>
            </div>

            {/* Nama PO */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama PO
                </label>
                <input
                    type="text"
                    value={namaPOValue}
                    onChange={(e) => setNamaPOValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: TWINNER TSAR, PB.SOTTE, BATIK..."
                />
            </div>

            {/* Sections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Sections</h3>
                    <button
                        onClick={addSection}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        Tambah Section
                    </button>
                </div>

                {sections.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                        <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Belum ada section</p>
                        <button
                            onClick={addSection}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Tambah Section Pertama
                        </button>
                    </div>
                ) : (
                    sections.map((section, index) => (
                        <SectionEditor
                            key={section.id}
                            section={section}
                            index={index}
                            format={getSectionFormat(section)}
                            onUpdate={(updates) => updateSection(section.id, updates)}
                            onRemove={() => removeSection(section.id)}
                            onFormatChange={(format) => changeSectionFormat(section.id, format)}
                            onUploadMockup={(file) => uploadImage(file, section.id, 'mockup')}
                            onRemoveMockup={(url) => removeMockupImage(section.id, url)}
                            isUploading={uploadingImage === `${section.id}-mockup`}
                        />
                    ))
                )}
            </div>

            {/* Production Specs */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Spesifikasi Produksi</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kerah</label>
                        <input
                            type="text"
                            value={specs.kerah || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, kerah: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="V NECK, Polo, dll"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bahan</label>
                        <input
                            type="text"
                            value={specs.bahan || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, bahan: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="MILANO PREMIUM, EMBOSS, dll"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bahan Celana</label>
                        <input
                            type="text"
                            value={specs.bahan_celana || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, bahan_celana: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Jika ada"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <input
                            type="text"
                            value={specs.kategori || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, kategori: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="PANJANG & PENDEK"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
                        <input
                            type="text"
                            value={specs.bis || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, bis: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="BRAND SENDIRI, POLOSIN"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Autentic</label>
                        <input
                            type="text"
                            value={specs.autentic || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, autentic: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="BRAND SENDIRI"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Penjahit</label>
                        <input
                            type="text"
                            value={specs.penjahit || ''}
                            onChange={(e) => setSpecs(prev => ({ ...prev, penjahit: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nama penjahit"
                        />
                    </div>
                </div>

                {/* Checklist */}
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-800 mb-2">WAJIB DIISI!</p>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={specs.need_atasan ?? false}
                                onChange={(e) => setSpecs(prev => ({ ...prev, need_atasan: e.target.checked }))}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-medium">ATASAN</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={specs.need_celana ?? false}
                                onChange={(e) => setSpecs(prev => ({ ...prev, need_celana: e.target.checked }))}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-medium">CELANA</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Production Notes */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Produksi
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Catatan khusus untuk produksi..."
                />
            </div>

            {/* Save Button */}
            <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                    onClick={handleSave}
                    disabled={saving || isLoading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Simpan SPK
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

// Section Editor Component
interface SectionEditorProps {
    section: SPKSection
    index: number
    format: SectionFormat
    onUpdate: (updates: Partial<SPKSection>) => void
    onRemove: () => void
    onFormatChange: (format: SectionFormat) => void
    onUploadMockup: (file: File) => void
    onRemoveMockup: (url: string) => void
    isUploading: boolean
}

function SectionEditor({
    section,
    index,
    format,
    onUpdate,
    onRemove,
    onFormatChange,
    onUploadMockup,
    onRemoveMockup,
    isUploading
}: SectionEditorProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onUploadMockup(file)
        }
    }

    // Add size rekap item
    const addSizeRekap = () => {
        const current = section.size_rekap || []
        onUpdate({
            size_rekap: [...current, { size: 'M', jumlah: 0, keterangan: '' }]
        })
    }

    // Update size rekap item
    const updateSizeRekap = (idx: number, updates: Partial<SizeRekapItem>) => {
        const current = section.size_rekap || []
        onUpdate({
            size_rekap: current.map((item, i) => i === idx ? { ...item, ...updates } : item)
        })
    }

    // Remove size rekap item
    const removeSizeRekap = (idx: number) => {
        const current = section.size_rekap || []
        onUpdate({
            size_rekap: current.filter((_, i) => i !== idx)
        })
    }

    // Add person
    const addPerson = () => {
        const current = section.personalization_list || []
        onUpdate({
            personalization_list: [...current, { name: '', size: 'M' }]
        })
    }

    // Update person
    const updatePerson = (idx: number, updates: Partial<PersonItem>) => {
        const current = section.personalization_list || []
        onUpdate({
            personalization_list: current.map((item, i) => i === idx ? { ...item, ...updates } : item)
        })
    }

    // Remove person
    const removePerson = (idx: number) => {
        const current = section.personalization_list || []
        onUpdate({
            personalization_list: current.filter((_, i) => i !== idx)
        })
    }

    // Update simple size breakdown
    const updateSizeBreakdown = (size: string, qty: number) => {
        const current = section.size_breakdown || {}
        if (qty <= 0) {
            const { [size]: _, ...rest } = current
            onUpdate({ size_breakdown: rest })
        } else {
            onUpdate({ size_breakdown: { ...current, [size]: qty } })
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                    <GripVertical size={18} className="text-gray-400 cursor-grab" />
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold"
                        placeholder="Nama section"
                    />
                </div>
                <button
                    onClick={onRemove}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Mockup Images */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mockup Images
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {section.mockup_urls.map((url, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={url}
                                    alt={`Mockup ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg border"
                                />
                                <button
                                    onClick={() => onRemoveMockup(url)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            {isUploading ? (
                                <span className="text-xs text-gray-500">Uploading...</span>
                            ) : (
                                <>
                                    <Upload size={20} className="text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>

                {/* Format Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <div className="flex gap-2">
                        {(['simple', 'rekap', 'personalization'] as SectionFormat[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => onFormatChange(f)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${format === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {f === 'simple' && 'Simple Rekap'}
                                {f === 'rekap' && 'Dengan Keterangan'}
                                {f === 'personalization' && 'Detail Nama'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Format-specific content */}
                {format === 'simple' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rekap Ukuran</label>
                        <div className="grid grid-cols-4 gap-2">
                            {AVAILABLE_SIZES.map(size => (
                                <div key={size} className="flex items-center gap-2">
                                    <span className="w-12 text-sm font-medium">{size}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={section.size_breakdown?.[size] || 0}
                                        onChange={(e) => updateSizeBreakdown(size, parseInt(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {format === 'rekap' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Rekap dengan Keterangan</label>
                            <button
                                onClick={addSizeRekap}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                + Tambah Row
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">Size</th>
                                    <th className="px-3 py-2 text-left">Jumlah</th>
                                    <th className="px-3 py-2 text-left">Keterangan</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(section.size_rekap || []).map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="px-3 py-2">
                                            <select
                                                value={item.size}
                                                onChange={(e) => updateSizeRekap(idx, { size: e.target.value })}
                                                className="w-full px-2 py-1 border rounded"
                                            >
                                                {AVAILABLE_SIZES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.jumlah}
                                                onChange={(e) => updateSizeRekap(idx, { jumlah: parseInt(e.target.value) || 0 })}
                                                className="w-20 px-2 py-1 border rounded text-center"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.keterangan || ''}
                                                onChange={(e) => updateSizeRekap(idx, { keterangan: e.target.value })}
                                                className="w-full px-2 py-1 border rounded"
                                                placeholder="BAHAN MICROCOOL"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                onClick={() => removeSizeRekap(idx)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {format === 'personalization' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Daftar Nama</label>
                            <button
                                onClick={addPerson}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                + Tambah Orang
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left w-10">No</th>
                                        <th className="px-2 py-2 text-left">Nama</th>
                                        <th className="px-2 py-2 text-left">Nama Punggung</th>
                                        <th className="px-2 py-2 text-left w-20">Size</th>
                                        <th className="px-2 py-2 text-left w-28">Lengan</th>
                                        <th className="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(section.personalization_list || []).map((person, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-2 py-2 text-gray-500">{idx + 1}</td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={person.name}
                                                    onChange={(e) => updatePerson(idx, { name: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded"
                                                    placeholder="Nama"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={person.back_name || ''}
                                                    onChange={(e) => updatePerson(idx, { back_name: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded"
                                                    placeholder="Nama punggung"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={person.size}
                                                    onChange={(e) => updatePerson(idx, { size: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded"
                                                >
                                                    {AVAILABLE_SIZES.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={person.sleeve_type || 'Pendek'}
                                                    onChange={(e) => updatePerson(idx, { sleeve_type: e.target.value as typeof SLEEVE_TYPES[number] })}
                                                    className="w-full px-2 py-1 border rounded text-xs"
                                                >
                                                    {SLEEVE_TYPES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <button
                                                    onClick={() => removePerson(idx)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Section</label>
                    <input
                        type="text"
                        value={section.notes || ''}
                        onChange={(e) => onUpdate({ notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Catatan khusus untuk section ini..."
                    />
                </div>
            </div>
        </div>
    )
}
