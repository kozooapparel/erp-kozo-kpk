'use client'

import { useEffect, useState } from 'react'
import { createBarang } from '@/lib/actions/barang'
import type { Barang } from '@/types/database'
import { toast } from 'sonner'
import { Modal, ModalFooter, CurrencyInput } from '@/components/ui'

interface QuickCreateBarangModalProps {
    isOpen: boolean
    onClose: () => void
    /** Brand tujuan barang baru (wajib) */
    brandId: string
    /** Nama awal, biasanya diambil dari teks yang sudah diketik di picker */
    initialName?: string
    /** Dipanggil setelah barang berhasil dibuat */
    onCreated: (barang: Barang) => void
}

const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15'

/**
 * Form cepat untuk menambah barang baru tanpa keluar dari halaman invoice.
 * Barang yang dibuat langsung dipakai pada baris invoice yang sedang aktif.
 */
export default function QuickCreateBarangModal({
    isOpen,
    onClose,
    brandId,
    initialName = '',
    onCreated,
}: QuickCreateBarangModalProps) {
    const [nama, setNama] = useState('')
    const [satuan, setSatuan] = useState('PCS')
    const [harga, setHarga] = useState(0)
    const [kategori, setKategori] = useState('')
    const [saving, setSaving] = useState(false)

    // Reset form setiap kali modal dibuka
    useEffect(() => {
        if (!isOpen) return
        setNama(initialName)
        setSatuan('PCS')
        setHarga(0)
        setKategori('')
        setSaving(false)
    }, [isOpen, initialName])

    const handleSave = async () => {
        const namaBarang = nama.trim()
        if (!namaBarang) {
            toast.warning('Nama barang harus diisi')
            return
        }
        if (!brandId) {
            toast.warning('Pilih brand terlebih dahulu')
            return
        }

        setSaving(true)
        try {
            const created = await createBarang({
                brand_id: brandId,
                nama_barang: namaBarang,
                satuan: satuan.trim() || 'PCS',
                harga_satuan: harga || 0,
                kategori: kategori.trim() || null,
            })

            if (!created) {
                toast.error('Gagal menyimpan barang')
                return
            }

            toast.success('Barang baru berhasil disimpan')
            onCreated(created)
            onClose()
        } catch (error) {
            console.error('Error creating barang:', error)
            toast.error('Gagal menyimpan barang')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Barang Baru" size="md">
            <div
                className="space-y-4 p-5"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSave()
                    }
                }}
            >
                <div>
                    <label className="label">
                        Nama Barang <span className="text-brand-600">*</span>
                    </label>
                    <input
                        type="text"
                        value={nama}
                        autoFocus
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: Kaos Polos Combed 30s"
                        className={inputClass}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Satuan</label>
                        <input
                            type="text"
                            value={satuan}
                            onChange={(e) => setSatuan(e.target.value)}
                            placeholder="PCS"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="label">Harga Satuan</label>
                        <CurrencyInput
                            value={harga || ''}
                            onChange={setHarga}
                            min={0}
                            placeholder="0"
                            className="!py-2 !rounded-lg !bg-white !border-slate-200 focus:!ring-brand-500/15"
                        />
                    </div>
                </div>

                <div>
                    <label className="label">
                        Kategori <span className="font-normal text-slate-400">(opsional)</span>
                    </label>
                    <input
                        type="text"
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                        placeholder="Contoh: Kaos"
                        className={inputClass}
                    />
                </div>

                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                    Barang ini akan otomatis dipakai pada baris invoice saat ini. Harga bisa
                    disesuaikan kapan saja dari menu Barang.
                </p>
            </div>

            <div className="px-5 pb-5">
                <ModalFooter
                    type="button"
                    onCancel={onClose}
                    onSubmit={handleSave}
                    submitText="Simpan & Pakai"
                    loading={saving}
                />
            </div>
        </Modal>
    )
}
