'use client'

import Link from 'next/link'
import { useState } from 'react'
import { InvoiceWithCustomer } from '@/types/database'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import { DEFAULT_DATE_RANGE, DateRangeValue, formatRangeLabel, isDateInRange } from '@/lib/utils/date-range'
import { DateRangeFilter } from '@/components/ui'

interface RekapInvoiceTableProps {
    invoices: InvoiceWithCustomer[]
}

export default function RekapInvoiceTable({ invoices }: RekapInvoiceTableProps) {
    const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE)

    const filteredInvoices = invoices.filter(inv => isDateInRange(inv.tanggal, dateRange))

    // Calculate summaries
    const totalInvoice = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalDibayar = filteredInvoices.reduce((sum, inv) => sum + inv.total_dibayar, 0)
    const totalSisa = filteredInvoices.reduce((sum, inv) => sum + inv.sisa_tagihan, 0)
    const countLunas = filteredInvoices.filter(inv => inv.status_pembayaran === 'SUDAH_LUNAS').length
    const countBelum = filteredInvoices.filter(inv => inv.status_pembayaran === 'BELUM_LUNAS').length

    return (
        <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    Periode: <span className="font-medium text-slate-700">{formatRangeLabel(dateRange)}</span>
                </p>
                <DateRangeFilter
                    value={dateRange}
                    onChange={setDateRange}
                    accent="orange"
                    align="right"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Invoice</p>
                    <p className="text-xl font-bold text-slate-900">{filteredInvoices.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Nilai Invoice</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(totalInvoice)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Total Dibayar</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalDibayar)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Sisa Tagihan</p>
                    <p className="text-xl font-bold text-orange-500">{formatCurrency(totalSisa)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="text-sm">
                        <span className="text-emerald-600 font-medium">🟢 {countLunas} Lunas</span>
                        <span className="mx-2">|</span>
                        <span className="text-orange-500 font-medium">🟠 {countBelum} Belum</span>
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">No Invoice</th>
                                <th className="text-left font-medium px-4 py-3">Tgl Invoice</th>
                                <th className="text-left font-medium px-4 py-3">Termin</th>
                                <th className="text-left font-medium px-4 py-3">Jatuh Tempo</th>
                                <th className="text-left font-medium px-4 py-3">No PO</th>
                                <th className="text-left font-medium px-4 py-3">Customer</th>
                                <th className="text-left font-medium px-4 py-3">Alamat</th>
                                <th className="text-left font-medium px-4 py-3">Telpon</th>
                                <th className="text-right font-medium px-4 py-3">Sub Total</th>
                                <th className="text-right font-medium px-4 py-3">Pajak</th>
                                <th className="text-right font-medium px-4 py-3">Total</th>
                                <th className="text-right font-medium px-4 py-3">Pembayaran</th>
                                <th className="text-right font-medium px-4 py-3">Sisa</th>
                                <th className="text-center font-medium px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="px-4 py-12 text-center text-slate-500">
                                        Tidak ada invoice pada rentang tanggal ini
                                    </td>
                                </tr>
                            ) : filteredInvoices.map((inv) => {
                                // Calculate jatuh tempo
                                const jatuhTempo = new Date(inv.tanggal)
                                jatuhTempo.setDate(jatuhTempo.getDate() + (inv.termin_pembayaran || 0))

                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-blue-600">
                                            <Link href={`/invoices/${inv.id}`} className="hover:underline">
                                                {inv.no_invoice}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateShort(inv.tanggal)}</td>
                                        <td className="px-4 py-3 text-slate-600">{inv.termin_pembayaran} hari</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateShort(jatuhTempo)}</td>
                                        <td className="px-4 py-3 text-slate-600">{inv.no_po || '-'}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{inv.customer?.name}</td>
                                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{inv.customer?.alamat || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{inv.customer?.phone}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.sub_total)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.ppn_amount)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(inv.total)}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(inv.total_dibayar)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-orange-500">{formatCurrency(inv.sisa_tagihan)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${inv.status_pembayaran === 'SUDAH_LUNAS'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {inv.status_pembayaran === 'SUDAH_LUNAS' ? '🟢 LUNAS' : '🟠 BELUM'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
