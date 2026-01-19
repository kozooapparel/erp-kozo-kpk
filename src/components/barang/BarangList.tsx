'use client'

import { useState, useEffect } from 'react'
import { Barang, BarangHargaTier, BarangWithTiers } from '@/types/database'
import { getBarangList, createBarang, updateBarang, deleteBarang, getBarangById } from '@/lib/actions/barang'
import { formatCurrency } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

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
    const [hargaSatuan, setHargaSatuan] = useState('')
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
        setHargaSatuan('')
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
            setHargaSatuan(barang.harga_satuan.toString())
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
            alert('Nama barang harus diisi')
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
                    harga_satuan: parseFloat(hargaSatuan) || 0,
                    kategori: kategori || null
                }, tierData)
            } else {
                await createBarang({
                    nama_barang: namaBarang,
                    satuan,
                    harga_satuan: parseFloat(hargaSatuan) || 0,
                    kategori: kategori || null
                }, tierData)
            }

            closeModal()
            loadBarang()
        } catch (error) {
            console.error('Error saving barang:', error)
            alert('Gagal menyimpan barang')
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
            alert('Gagal menghapus barang')
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
                                    <input
                                        type="number"
                                        value={hargaSatuan}
                                        onChange={(e) => setHargaSatuan(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        placeholder="0"
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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">Harga Tier (berdasarkan quantity)</label>
                                    <button
                                        type="button"
                                        onClick={addTierRow}
                                        className="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        + Tier
                                    </button>
                                </div>

                                {hargaTiers.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Belum ada tier harga. Harga default akan digunakan.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {hargaTiers.map((tier, index) => (
                                            <div key={tier.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                <span className="text-sm text-slate-500 w-8">{index + 1}.</span>
                                                <input
                                                    type="number"
                                                    value={tier.min_qty}
                                                    onChange={(e) => updateTier(index, 'min_qty', parseInt(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                                    placeholder="Min"
                                                />
                                                <span className="text-sm text-slate-500">-</span>
                                                <input
                                                    type="number"
                                                    value={tier.max_qty || ''}
                                                    onChange={(e) => updateTier(index, 'max_qty', e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                                    placeholder="∞"
                                                />
                                                <span className="text-sm text-slate-500">pcs =</span>
                                                <input
                                                    type="number"
                                                    value={tier.harga}
                                                    onChange={(e) => updateTier(index, 'harga', parseFloat(e.target.value) || 0)}
                                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                                    placeholder="Harga"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeTierRow(index)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
