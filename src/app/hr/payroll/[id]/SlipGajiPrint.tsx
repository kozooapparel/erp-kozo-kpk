'use client'

import { useRef } from 'react'

interface PayrollEntry {
    id: string
    employee_id: string
    base_salary: number
    total_work_days: number
    total_allowances: number
    total_overtime: number
    total_bonuses: number
    total_deductions: number
    gross_salary: number
    net_salary: number
    employees: {
        nik: string
        full_name: string
        department: string
        position: string
    }
}

interface SlipGajiPrintProps {
    entry: PayrollEntry
    period: {
        period_name: string
        start_date: string
        end_date: string
        payment_date: string
    }
    companyName?: string
}

export function SlipGajiPrint({ entry, period, companyName = 'Kozo KPK' }: SlipGajiPrintProps) {
    const printRef = useRef<HTMLDivElement>(null)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handlePrint = () => {
        const printContent = printRef.current
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Slip Gaji - ${entry.employees.full_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 20px;
                        background: white;
                    }
                    .slip-container {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 2px solid #1e293b;
                        padding: 24px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #1e293b;
                        padding-bottom: 16px;
                        margin-bottom: 16px;
                    }
                    .company-name {
                        font-size: 24px;
                        font-weight: bold;
                        color: #dc2626;
                    }
                    .slip-title {
                        font-size: 18px;
                        font-weight: 600;
                        margin-top: 8px;
                    }
                    .period {
                        font-size: 14px;
                        color: #64748b;
                        margin-top: 4px;
                    }
                    .employee-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        margin-bottom: 16px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                    }
                    .info-label {
                        color: #64748b;
                        font-size: 12px;
                    }
                    .info-value {
                        font-weight: 600;
                        font-size: 13px;
                    }
                    .section {
                        margin-bottom: 16px;
                    }
                    .section-title {
                        font-weight: 600;
                        font-size: 14px;
                        color: #1e293b;
                        margin-bottom: 8px;
                        padding-bottom: 4px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        padding: 6px 0;
                        font-size: 13px;
                    }
                    .row-label { color: #475569; }
                    .row-value { font-weight: 500; }
                    .row-value.positive { color: #16a34a; }
                    .row-value.negative { color: #dc2626; }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 12px;
                        background: #1e293b;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        border-radius: 8px;
                        margin-top: 16px;
                    }
                    .signature-section {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                        margin-top: 40px;
                        text-align: center;
                    }
                    .signature-box {
                        padding-top: 60px;
                        border-top: 1px solid #1e293b;
                    }
                    .signature-label {
                        font-size: 12px;
                        color: #64748b;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 24px;
                        font-size: 11px;
                        color: #94a3b8;
                    }
                    @media print {
                        body { padding: 0; }
                        .slip-container { border: 1px solid #000; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <>
            <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Print Slip Gaji"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
            </button>

            {/* Hidden print content */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    <div className="slip-container">
                        <div className="header">
                            <div className="company-name">{companyName}</div>
                            <div className="slip-title">SLIP GAJI KARYAWAN</div>
                            <div className="period">{period.period_name}</div>
                            <div className="period">{formatDate(period.start_date)} - {formatDate(period.end_date)}</div>
                        </div>

                        <div className="employee-info">
                            <div className="info-row">
                                <span className="info-label">Nama</span>
                                <span className="info-value">{entry.employees.full_name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">NIK</span>
                                <span className="info-value">{entry.employees.nik}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Departemen</span>
                                <span className="info-value">{entry.employees.department}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Jabatan</span>
                                <span className="info-value">{entry.employees.position || '-'}</span>
                            </div>
                        </div>

                        <div className="section">
                            <div className="section-title">PENDAPATAN</div>
                            <div className="row">
                                <span className="row-label">Gaji Pokok ({entry.total_work_days} hari kerja)</span>
                                <span className="row-value">{formatCurrency(entry.base_salary)}</span>
                            </div>
                            <div className="row">
                                <span className="row-label">Tunjangan</span>
                                <span className="row-value positive">+{formatCurrency(entry.total_allowances)}</span>
                            </div>
                            <div className="row">
                                <span className="row-label">Lembur</span>
                                <span className="row-value positive">+{formatCurrency(entry.total_overtime)}</span>
                            </div>
                            <div className="row">
                                <span className="row-label">Bonus</span>
                                <span className="row-value positive">+{formatCurrency(entry.total_bonuses)}</span>
                            </div>
                            <div className="row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontWeight: 600 }}>
                                <span className="row-label">Total Pendapatan</span>
                                <span className="row-value">{formatCurrency(entry.gross_salary)}</span>
                            </div>
                        </div>

                        <div className="section">
                            <div className="section-title">POTONGAN</div>
                            <div className="row">
                                <span className="row-label">Potongan (Kasbon, dll)</span>
                                <span className="row-value negative">-{formatCurrency(entry.total_deductions)}</span>
                            </div>
                        </div>

                        <div className="total-row">
                            <span>GAJI BERSIH (Take Home Pay)</span>
                            <span>{formatCurrency(entry.net_salary)}</span>
                        </div>

                        <div className="signature-section">
                            <div>
                                <div className="signature-box">
                                    <div className="signature-label">Diterima oleh,</div>
                                    <div style={{ marginTop: '4px', fontWeight: 600 }}>{entry.employees.full_name}</div>
                                </div>
                            </div>
                            <div>
                                <div className="signature-box">
                                    <div className="signature-label">Disetujui oleh,</div>
                                    <div style={{ marginTop: '4px', fontWeight: 600 }}>Manager HRD</div>
                                </div>
                            </div>
                        </div>

                        <div className="footer">
                            Slip gaji ini digenerate secara otomatis oleh sistem.<br />
                            Tanggal pembayaran: {formatDate(period.payment_date)}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

// Print all slips at once
export function PrintAllSlips({
    entries,
    period,
    companyName = 'Kozo KPK'
}: {
    entries: PayrollEntry[]
    period: SlipGajiPrintProps['period']
    companyName?: string
}) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handlePrintAll = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const slipsHtml = entries.map((entry, index) => `
            <div class="slip-container" ${index > 0 ? 'style="page-break-before: always;"' : ''}>
                <div class="header">
                    <div class="company-name">${companyName}</div>
                    <div class="slip-title">SLIP GAJI KARYAWAN</div>
                    <div class="period">${period.period_name}</div>
                    <div class="period">${formatDate(period.start_date)} - ${formatDate(period.end_date)}</div>
                </div>

                <div class="employee-info">
                    <div class="info-row">
                        <span class="info-label">Nama</span>
                        <span class="info-value">${entry.employees.full_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">NIK</span>
                        <span class="info-value">${entry.employees.nik}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Departemen</span>
                        <span class="info-value">${entry.employees.department}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Jabatan</span>
                        <span class="info-value">${entry.employees.position || '-'}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">PENDAPATAN</div>
                    <div class="row">
                        <span class="row-label">Gaji Pokok (${entry.total_work_days} hari kerja)</span>
                        <span class="row-value">${formatCurrency(entry.base_salary)}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Tunjangan</span>
                        <span class="row-value positive">+${formatCurrency(entry.total_allowances)}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Lembur</span>
                        <span class="row-value positive">+${formatCurrency(entry.total_overtime)}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Bonus</span>
                        <span class="row-value positive">+${formatCurrency(entry.total_bonuses)}</span>
                    </div>
                    <div class="row" style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-weight: 600;">
                        <span class="row-label">Total Pendapatan</span>
                        <span class="row-value">${formatCurrency(entry.gross_salary)}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">POTONGAN</div>
                    <div class="row">
                        <span class="row-label">Potongan (Kasbon, dll)</span>
                        <span class="row-value negative">-${formatCurrency(entry.total_deductions)}</span>
                    </div>
                </div>

                <div class="total-row">
                    <span>GAJI BERSIH (Take Home Pay)</span>
                    <span>${formatCurrency(entry.net_salary)}</span>
                </div>

                <div class="signature-section">
                    <div>
                        <div class="signature-box">
                            <div class="signature-label">Diterima oleh,</div>
                            <div style="margin-top: 4px; font-weight: 600;">${entry.employees.full_name}</div>
                        </div>
                    </div>
                    <div>
                        <div class="signature-box">
                            <div class="signature-label">Disetujui oleh,</div>
                            <div style="margin-top: 4px; font-weight: 600;">Manager HRD</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    Slip gaji ini digenerate secara otomatis oleh sistem.<br/>
                    Tanggal pembayaran: ${formatDate(period.payment_date)}
                </div>
            </div>
        `).join('')

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Slip Gaji - ${period.period_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 20px;
                        background: white;
                    }
                    .slip-container {
                        max-width: 600px;
                        margin: 0 auto 40px;
                        border: 2px solid #1e293b;
                        padding: 24px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #1e293b;
                        padding-bottom: 16px;
                        margin-bottom: 16px;
                    }
                    .company-name {
                        font-size: 24px;
                        font-weight: bold;
                        color: #dc2626;
                    }
                    .slip-title {
                        font-size: 18px;
                        font-weight: 600;
                        margin-top: 8px;
                    }
                    .period {
                        font-size: 14px;
                        color: #64748b;
                        margin-top: 4px;
                    }
                    .employee-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        margin-bottom: 16px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                    }
                    .info-label {
                        color: #64748b;
                        font-size: 12px;
                    }
                    .info-value {
                        font-weight: 600;
                        font-size: 13px;
                    }
                    .section {
                        margin-bottom: 16px;
                    }
                    .section-title {
                        font-weight: 600;
                        font-size: 14px;
                        color: #1e293b;
                        margin-bottom: 8px;
                        padding-bottom: 4px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        padding: 6px 0;
                        font-size: 13px;
                    }
                    .row-label { color: #475569; }
                    .row-value { font-weight: 500; }
                    .row-value.positive { color: #16a34a; }
                    .row-value.negative { color: #dc2626; }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 12px;
                        background: #1e293b;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        border-radius: 8px;
                        margin-top: 16px;
                    }
                    .signature-section {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                        margin-top: 40px;
                        text-align: center;
                    }
                    .signature-box {
                        padding-top: 60px;
                        border-top: 1px solid #1e293b;
                    }
                    .signature-label {
                        font-size: 12px;
                        color: #64748b;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 24px;
                        font-size: 11px;
                        color: #94a3b8;
                    }
                    @media print {
                        body { padding: 0; }
                        .slip-container { border: 1px solid #000; margin-bottom: 0; }
                    }
                </style>
            </head>
            <body>
                ${slipsHtml}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Semua Slip
        </button>
    )
}
