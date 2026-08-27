'use client'

import { useState, useEffect } from 'react'
import { Barang, BarangWithTiers } from '@/types/database'
import { getBarangList, createBarang, updateBarang, deleteBarang, getBarangById } from '@/lib/actions/barang'
import { formatCurrency } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import CurrencyInput from '@/components/ui/CurrencyInput'
import NumberInput from '@/components/ui/NumberInput'

interface HargaTierInput {
    id: string
    min_qty: number
    max_qty: number | null
    harga: number
}

export default function BarangList() {
    const router = useRouter()
    const [barangList, setBarangList] = useState<Barang[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBarang, setEditingBarang] = useState<BarangWithTiers | null>(null)

    // Form state
    const [namaBarang, setNamaBarang] = useState('')
    const [satuan, setSatuan] = useState('PCS')
    const [hargaSatuan, setHargaSatuan] = useState(0)
    const [kategori, setKategori] = useState('')
    const [hargaTiers, setHargaTiers] = useState<HargaTierInput[]>([])

    // Load barang list
    useEffect(() => {
        loadBarang()
    }, [])

    const loadBarang = async () => {
        setLoading(true)
        try {
            const data = await getBarangList()
            setBarangList(data)
        } catch (error) {
            console.error('Error loading barang:', error)
        } finally {
            setLoading(false)
        }
    }

    // Open modal for create
    const openCreateModal = () => {
        setEditingBarang(null)
        setNamaBarang('')
        setSatuan('PCS')
        setHargaSatuan(0)

        setKategori('')
        setHargaTiers([])
        setShowModal(true)
    }

    // Open modal for edit
    const openEditModal = async (id: string) => {
        const barang = await getBarangById(id)
        if (barang) {
            setEditingBarang(barang)
            setNamaBarang(barang.nama_barang)
            setSatuan(barang.satuan)
            setHargaSatuan(barang.harga_satuan)
            setKategori(barang.kategori || '')
            setHargaTiers(barang.harga_tiers.map((t, i) => ({
                id: `tier-${i}`,
                min_qty: t.min_qty,
                max_qty: t.max_qty,
                harga: t.harga
            })))
            setShowModal(true)
        }
    }

    // Close modal
    const closeModal = () => {
        setShowModal(false)
        setEditingBarang(null)
    }

    // Add tier row
    const addTierRow = () => {
        setHargaTiers([...hargaTiers, {
            id: `tier-${Date.now()}`,
            min_qty: 1,
            max_qty: null,
            harga: 0
        }])
    }

    // Remove tier row
    const removeTierRow = (index: number) => {
        setHargaTiers(hargaTiers.filter((_, i) => i !== index))
    }

    // Update tier
    const updateTier = (index: number, field: keyof HargaTierInput, value: number | null) => {
        const newTiers = [...hargaTiers]
        newTiers[index] = { ...newTiers[index], [field]: value }
        setHargaTiers(newTiers)
    }

    // Save barang
    const handleSave = async () => {
        if (!namaBarang) {
            toast.warning('Nama barang harus diisi')
            return
        }

        try {
            const tierData = hargaTiers.map(t => ({
                min_qty: t.min_qty,
                max_qty: t.max_qty,
                harga: t.harga
            }))

            if (editingBarang) {
                await updateBarang(editingBarang.id, {
                    nama_barang: namaBarang,
                    satuan,
                    harga_satuan: hargaSatuan,
                    kategori: kategori || null
                }, tierData)
            } else {
                await createBarang({
                    nama_barang: namaBarang,
                    satuan,
                    harga_satuan: hargaSatuan,
                    kategori: kategori || null
                }, tierData)
            }

            closeModal()
            loadBarang()
        } catch (error) {
            console.error('Error saving barang:', error)
            toast.error('Gagal menyimpan barang')
        }
    }

    // Delete barang
    const handleDelete = async (id: string) => {
        if (!confirm('Hapus barang ini?')) return

        try {
            await deleteBarang(id)
            loadBarang()
        } catch (error) {
            console.error('Error deleting barang:', error)
            toast.error('Gagal menghapus barang')
        }
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-slate-500">{barangList.length} produk aktif</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Barang
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Nama Barang</th>
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Satuan</th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Harga Satuan</th>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Kategori</th>
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : barangList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Belum ada barang. Klik "Tambah Barang" untuk menambahkan.
                                    </td>
                                </tr>
                            ) : (
                                barangList.map((barang) => (
                                    <tr key={barang.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{barang.nama_barang}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 text-center">{barang.satuan}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">{formatCurrency(barang.harga_satuan)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{barang.kategori || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(barang.id)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(barang.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingBarang ? 'Edit Barang' : 'Tambah Barang'}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Barang *</label>
                                <input
                                    type="text"
                                    value={namaBarang}
                                    onChange={(e) => setNamaBarang(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    placeholder="Contoh: Jersey Fullprint Premium 160/170 GMS"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                                    <input
                                        type="text"
                                        value={satuan}
                                        onChange={(e) => setSatuan(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        placeholder="PCS"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga Satuan Default</label>
                                    <CurrencyInput
                                        value={hargaSatuan}
                                        onChange={setHargaSatuan}
                                        placeholder="0"
                                        className="!rounded-lg !py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori (opsional)</label>
                                <input
                                    type="text"
                                    value={kategori}
                                    onChange={(e) => setKategori(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    placeholder="Contoh: Jersey, Kaos, Hoodie"
                                />
                            </div>

                            {/* Harga Tier */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-slate-700">Harga Tier (berdasarkan quantity)</label>
                                    <button
                                        type="button"
                                        onClick={addTierRow}
                                        className="px-3 py-1.5 bg-violet-50 text-violet-600 text-sm font-medium rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tambah Tier
                                    </button>
                                </div>

                                {hargaTiers.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-sm text-slate-500">Belum ada tier harga</p>
                                        <p className="text-xs text-slate-400 mt-1">Harga default akan digunakan untuk semua quantity</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {hargaTiers.map((tier, index) => (
                                            <div key={tier.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 group hover:border-violet-200 transition-colors">
                                                {/* Tier Number */}
                                                <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                    {index + 1}
                                                </span>

                                                {/* Range: Min - Max pcs */}
                                                <div className="flex items-center gap-1.5">
                                                    <NumberInput
                                                        value={tier.min_qty}
                                                        onChange={(val) => updateTier(index, 'min_qty', val)}
                                                        placeholder="1"
                                                        className="!w-16 !py-1.5 !px-2 !rounded-lg text-center text-sm"
                                                    />
                                                    <span className="text-slate-400 font-medium">-</span>
                                                    <NumberInput
                                                        value={tier.max_qty || 0}
                                                        onChange={(val) => updateTier(index, 'max_qty', val === 0 ? null : val)}
                                                        placeholder="∞"
                                                        allowEmpty
                                                        className="!w-16 !py-1.5 !px-2 !rounded-lg text-center text-sm"
                                                    />
                                                    <span className="text-sm text-slate-500 font-medium">pcs</span>
                                                </div>

                                                {/* Equals Sign */}
                                                <span className="text-violet-500 font-bold text-lg">=</span>

                                                {/* Price */}
                                                <div className="flex items-center gap-1 flex-1">
                                                    <span className="text-sm text-slate-500 font-medium">Rp</span>
                                                    <CurrencyInput
                                                        value={tier.harga}
                                                        onChange={(val) => updateTier(index, 'harga', val)}
                                                        placeholder="0"
                                                        showPrefix={false}
                                                        className="!py-1.5 !px-2 !rounded-lg text-sm font-semibold"
                                                    />
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTierRow(index)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
