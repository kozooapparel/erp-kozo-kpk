'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer, Barang, InvoiceWithItems, InvoiceItemInsert } from '@/types/database'
import { createInvoice, updateInvoice } from '@/lib/actions/invoices'
import { getBarangList, getHargaByQty } from '@/lib/actions/barang'
import { getBankInfo, getCompanyInfo, BankInfo, CompanyInfo } from '@/lib/actions/settings'
import { formatCurrency, formatDateInput } from '@/lib/utils/format'
import { terbilang } from '@/lib/utils/terbilang'
import { toast } from 'sonner'
import BrandSelector from './BrandSelector'

interface InvoiceFormProps {
    customers: Customer[]
    invoice?: InvoiceWithItems | null
    orderId?: string
    prefilledCustomerId?: string
    prefilledBrandId?: string
}

interface InvoiceItemRow {
    id: string
    barang_id: string | null
    deskripsi: string
    jumlah: number
    satuan: string
    harga_satuan: number
    sub_total: number
}

export default function InvoiceForm({
    customers,
    invoice,
    orderId,
    prefilledCustomerId,
    prefilledBrandId
}: InvoiceFormProps) {
    const router = useRouter()
    const isEdit = !!invoice

    // Form state
    const [loading, setLoading] = useState(false)
    const [customerId, setCustomerId] = useState(invoice?.customer_id || prefilledCustomerId || '')
    const [tanggal, setTanggal] = useState(formatDateInput(invoice?.tanggal || new Date()))
    const [perkiraanProduksi, setPerkiraanProduksi] = useState(invoice?.perkiraan_produksi?.toString() || '')
    const [deadline, setDeadline] = useState(formatDateInput(invoice?.deadline || null))
    const [terminPembayaran, setTerminPembayaran] = useState(invoice?.termin_pembayaran?.toString() || '16')
    const [noPo, setNoPo] = useState(invoice?.no_po || '')
    const [ppnPersen, setPpnPersen] = useState(invoice?.ppn_persen?.toString() || '0')
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(prefilledBrandId || null)

    // Items state
    const [items, setItems] = useState<InvoiceItemRow[]>(() => {
        if (invoice?.items && invoice.items.length > 0) {
            return invoice.items.map((item, index) => ({
                id: `item-${index}`,
                barang_id: item.barang_id,
                deskripsi: item.deskripsi,
                jumlah: item.jumlah,
                satuan: item.satuan,
                harga_satuan: item.harga_satuan,
                sub_total: item.sub_total
            }))
        }
        return [{
            id: `item-0`,
            barang_id: null,
            deskripsi: '',
            jumlah: 0,
            satuan: 'PCS',
            harga_satuan: 0,
            sub_total: 0
        }]
    })

    // Lookup data
    const [barangList, setBarangList] = useState<Barang[]>([])
    const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
    const [brandInfo, setBrandInfo] = useState<{ name: string; address: string | null; logo_url: string | null } | null>(null)

    // Load lookup data
    useEffect(() => {
        async function loadData() {
            const [barang, bank, company] = await Promise.all([
                getBarangList(),
                getBankInfo(),
                getCompanyInfo()
            ])
            setBarangList(barang)
            setBankInfo(bank)
            setCompanyInfo(company)

            // Fetch brand info if brand is selected or prefilled
            const activeBrandId = selectedBrandId || prefilledBrandId
            if (activeBrandId) {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                const { data: brand } = await supabase
                    .from('brands')
                    .select('company_name, address, logo_url, bank_name, account_name, account_number')
                    .eq('id', activeBrandId)
                    .single()
                if (brand) {
                    setBrandInfo({
                        name: brand.company_name,
                        address: brand.address,
                        logo_url: brand.logo_url
                    })
                    // Update bank info with brand-specific data
                    if (brand.bank_name && brand.account_name && brand.account_number) {
                        setBankInfo({
                            bank_name: brand.bank_name,
                            account_name: brand.account_name,
                            account_number: brand.account_number
                        })
                    }
                }
            }
        }
        loadData()
    }, [prefilledBrandId, selectedBrandId])

    // Calculate totals
    const subTotal = items.reduce((sum, item) => sum + item.sub_total, 0)
    const ppnAmount = (subTotal * parseFloat(ppnPersen || '0')) / 100
    const total = subTotal + ppnAmount

    // Get selected customer
    const selectedCustomer = customers.find(c => c.id === customerId)

    // Add row
    const addRow = () => {
        setItems([...items, {
            id: `item-${Date.now()}`,
            barang_id: null,
            deskripsi: '',
            jumlah: 0,
            satuan: 'PCS',
            harga_satuan: 0,
            sub_total: 0
        }])
    }

    // Remove row
    const removeRow = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    // Update item
    const updateItem = async (index: number, field: keyof InvoiceItemRow, value: string | number | null) => {
        const newItems = [...items]
        const item = { ...newItems[index] }

        if (field === 'barang_id' && value) {
            const barang = barangList.find(b => b.id === value)
            if (barang) {
                item.barang_id = value as string
                item.deskripsi = barang.nama_barang
                item.satuan = barang.satuan
                // Get harga based on quantity (if quantity already entered)
                if (item.jumlah > 0) {
                    item.harga_satuan = await getHargaByQty(value as string, item.jumlah)
                } else {
                    item.harga_satuan = barang.harga_satuan
                }
            }
        } else if (field === 'jumlah') {
            item.jumlah = parseInt(value as string) || 0
            // Update harga based on new quantity if barang selected
            if (item.barang_id) {
                item.harga_satuan = await getHargaByQty(item.barang_id, item.jumlah)
            }
        } else if (field === 'harga_satuan') {
            item.harga_satuan = parseFloat(value as string) || 0
        } else if (field === 'deskripsi') {
            item.deskripsi = value as string
            // Clear barang_id if manually editing description
            if (item.barang_id && value !== barangList.find(b => b.id === item.barang_id)?.nama_barang) {
                item.barang_id = null
            }
        } else if (field === 'satuan') {
            item.satuan = value as string
        }

        // Recalculate sub_total
        item.sub_total = item.jumlah * item.harga_satuan

        newItems[index] = item
        setItems(newItems)
    }

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!customerId) {
            toast.warning('Pilih customer terlebih dahulu')
            return
        }

        // Validate brand selection (critical for bank account info)
        const finalBrandId = selectedBrandId || prefilledBrandId
        if (!finalBrandId && !isEdit) {
            toast.error('🚨 Pilih Brand terlebih dahulu! Ini menentukan rekening bank yang akan digunakan.')
            return
        }

        if (items.every(item => !item.deskripsi)) {
            toast.warning('Tambahkan minimal satu item')
            return
        }

        setLoading(true)

        try {
            const customerName = customers.find(c => c.id === customerId)?.name || 'Customer'

            const invoiceItems: Omit<InvoiceItemInsert, 'invoice_id'>[] = items
                .filter(item => item.deskripsi)
                .map((item, index) => ({
                    item_no: index + 1,
                    barang_id: item.barang_id,
                    deskripsi: item.deskripsi,
                    jumlah: item.jumlah,
                    satuan: item.satuan,
                    harga_satuan: item.harga_satuan,
                    sub_total: item.sub_total
                }))

            if (isEdit && invoice) {
                await updateInvoice(invoice.id, {
                    customer_id: customerId,
                    tanggal,
                    perkiraan_produksi: perkiraanProduksi ? parseInt(perkiraanProduksi) : null,
                    deadline: deadline || null,
                    termin_pembayaran: parseInt(terminPembayaran) || 16,
                    no_po: noPo || null,
                    ppn_persen: parseFloat(ppnPersen) || 0
                }, invoiceItems)
            } else {
                const finalBrandId = selectedBrandId || prefilledBrandId
                await createInvoice({
                    customerName,
                    customer_id: customerId,
                    order_id: orderId || null,
                    brand_id: finalBrandId || null,
                    tanggal,
                    perkiraan_produksi: perkiraanProduksi ? parseInt(perkiraanProduksi) : null,
                    deadline: deadline || null,
                    termin_pembayaran: parseInt(terminPembayaran) || 16,
                    no_po: noPo || null,
                    ppn_persen: parseFloat(ppnPersen) || 0
                }, invoiceItems)
            }

            router.push('/invoices')
            router.refresh()
        } catch (error) {
            console.error('Error saving invoice:', error)
            toast.error('Gagal menyimpan invoice')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => router.push('/invoices/new')}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                >
                    Buat Baru
                </button>
            </div>

            {/* Brand Selector - Only show for manual invoice creation (no order context) */}
            {!prefilledBrandId && !isEdit && (
                <BrandSelector
                    selectedBrandId={selectedBrandId}
                    onSelect={setSelectedBrandId}
                    required={true}
                />
            )}

            {/* Invoice Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Invoice Header with Brand */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                        {/* Left: Invoice Info */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">INVOICE</h1>
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">
                                    {invoice?.no_invoice || 'DRAFT'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 w-20">No Invoice</span>
                                    <span className="font-mono font-medium text-slate-700">
                                        {invoice?.no_invoice || '(Auto-generate)'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 w-16">Tanggal</span>
                                    <input
                                        type="date"
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: Brand/Company Info with Logo */}
                        <div className="text-right flex flex-col items-end">
                            {brandInfo?.logo_url && (
                                <img
                                    src={brandInfo.logo_url}
                                    alt={brandInfo.name}
                                    className="w-16 h-16 object-contain mb-2 rounded-lg"
                                />
                            )}
                            <h2 className="text-xl font-bold text-orange-500">
                                {brandInfo?.name || companyInfo?.name || 'KOZO KPK'}
                            </h2>
                            <p className="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                                {brandInfo?.address || companyInfo?.address}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Production Info Bar */}
                <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-slate-500">Produksi:</span>
                        <input
                            type="number"
                            value={perkiraanProduksi}
                            onChange={(e) => setPerkiraanProduksi(e.target.value)}
                            placeholder="16"
                            className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        <span className="text-sm text-slate-400">hari</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-slate-500">Deadline:</span>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                    </div>
                </div>

                {/* Customer Section */}
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                required
                            >
                                <option value="">Pilih Customer</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            {selectedCustomer && (
                                <div className="mt-2 text-sm text-slate-600">
                                    <p>{selectedCustomer.alamat || '-'}</p>
                                    <p>Telp: {selectedCustomer.phone}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-sm font-medium text-slate-700">No PO</label>
                                <span className="text-xs text-slate-400">(opsional)</span>
                            </div>
                            <input
                                type="text"
                                value={noPo}
                                onChange={(e) => setNoPo(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                placeholder="Nomor PO Customer"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Detail Item</h3>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-200">
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-2 w-10">#</th>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-2">Deskripsi</th>
                                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-2 w-20">Qty</th>
                                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-2 w-20">Satuan</th>
                                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-2 w-32">Harga</th>
                                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-2 w-32">Subtotal</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="py-2 text-sm text-slate-500">{index + 1}</td>
                                    <td className="py-2">
                                        <div className="flex flex-col gap-1">
                                            <select
                                                value={item.barang_id || ''}
                                                onChange={(e) => updateItem(index, 'barang_id', e.target.value || null)}
                                                className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            >
                                                <option value="">-- Pilih Barang atau Ketik Manual --</option>
                                                {barangList.map(barang => (
                                                    <option key={barang.id} value={barang.id}>
                                                        {barang.nama_barang}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={item.deskripsi}
                                                onChange={(e) => updateItem(index, 'deskripsi', e.target.value)}
                                                className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                placeholder="Deskripsi item..."
                                            />
                                        </div>
                                    </td>
                                    <td className="py-2">
                                        <input
                                            type="number"
                                            value={item.jumlah || ''}
                                            onChange={(e) => updateItem(index, 'jumlah', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </td>
                                    <td className="py-2">
                                        <input
                                            type="text"
                                            value={item.satuan}
                                            onChange={(e) => updateItem(index, 'satuan', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </td>
                                    <td className="py-2">
                                        <input
                                            type="number"
                                            value={item.harga_satuan || ''}
                                            onChange={(e) => updateItem(index, 'harga_satuan', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </td>
                                    <td className="py-2 text-right text-sm font-medium text-slate-900">
                                        {formatCurrency(item.sub_total)}
                                    </td>
                                    <td className="py-2">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            disabled={items.length === 1}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Add/Remove Row Buttons */}
                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={addRow}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            + BARIS
                        </button>
                        <button
                            type="button"
                            onClick={() => removeRow(items.length - 1)}
                            disabled={items.length === 1}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                            - BARIS
                        </button>
                    </div>
                </div>

                {/* Totals Section */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
                    <div className="flex justify-end">
                        <div className="w-80 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium text-slate-700">{formatCurrency(subTotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">PPN</span>
                                        <input
                                            type="number"
                                            value={ppnPersen}
                                            onChange={(e) => setPpnPersen(e.target.value)}
                                            className="w-12 px-2 py-0.5 border border-slate-200 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            min="0"
                                            max="100"
                                        />
                                        <span className="text-slate-400 text-xs">%</span>
                                    </div>
                                    <span className="font-medium text-slate-700">{formatCurrency(ppnAmount)}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-slate-800">TOTAL</span>
                                        <span className="text-xl font-bold text-emerald-600">{formatCurrency(total)}</span>
                                    </div>
                                    {total > 0 && (
                                        <p className="text-xs text-slate-400 italic text-right mt-1">
                                            {terbilang(total)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Info */}
                {bankInfo && (
                    <div className="p-6 border-t border-slate-200 bg-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pembayaran</h4>
                                <div className="space-y-1 text-sm">
                                    <p className="text-slate-600">Bank: <span className="font-semibold text-blue-600">{bankInfo.bank_name}</span></p>
                                    <p className="text-slate-600">A/N: <span className="font-medium text-slate-800">{bankInfo.account_name}</span></p>
                                    <p className="text-slate-600">No. Rek: <span className="font-mono font-medium text-slate-800">{bankInfo.account_number}</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                                <span className="text-sm text-slate-500">Termin:</span>
                                <input
                                    type="number"
                                    value={terminPembayaran}
                                    onChange={(e) => setTerminPembayaran(e.target.value)}
                                    className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                />
                                <span className="text-sm text-slate-400">hari</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </form>
    )
}
