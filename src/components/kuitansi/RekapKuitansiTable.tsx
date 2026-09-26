'use client'

import Link from 'next/link'
import { useState } from 'react'
import { KuitansiWithInvoice } from '@/types/database'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import { DEFAULT_DATE_RANGE, DateRangeValue, formatRangeLabel, isDateInRange } from '@/lib/utils/date-range'
import { DateRangeFilter } from '@/components/ui'

interface RekapKuitansiTableProps {
    kuitansiList: KuitansiWithInvoice[]
}

export default function RekapKuitansiTable({ kuitansiList }: RekapKuitansiTableProps) {
    const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE)

    const filteredList = kuitansiList.filter(k => isDateInRange(k.tanggal, dateRange))

    // Calculate total
    const totalPembayaran = filteredList.reduce((sum, k) => sum + k.jumlah, 0)

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
                    accent="emerald"
                    align="right"
                />
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-xl text-white">
                <p className="text-sm text-emerald-100">Total Penerimaan</p>
                <p className="text-4xl font-bold">{formatCurrency(totalPembayaran)}</p>
                <p className="text-sm text-emerald-100 mt-1">{filteredList.length} transaksi</p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-cyan-600 text-white">
                            <tr>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">No</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Tanggal</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">No Invoice</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Customer</th>
                                <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">Jumlah</th>
                                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Tidak ada kuitansi pada rentang tanggal ini
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((k, index) => (
                                    <tr key={k.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">{index + 1}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDateShort(k.tanggal)}</td>
                                        <td className="px-6 py-4 font-medium text-cyan-600">
                                            <Link href={`/invoices/${k.invoice?.id}`} className="hover:underline">
                                                {k.invoice?.no_invoice}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{k.invoice?.customer?.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(k.jumlah)}</td>
                                        <td className="px-6 py-4 text-slate-600">{k.keterangan}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredList.length > 0 && (
                            <tfoot className="bg-slate-100">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 font-bold text-slate-900 text-right">TOTAL</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(totalPembayaran)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    )
}
