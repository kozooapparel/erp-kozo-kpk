'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { KuitansiWithInvoice } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { terbilang } from '@/lib/utils/terbilang'

// Styles untuk PDF Kuitansi
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        backgroundColor: '#1e293b',
        color: 'white',
        padding: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    headerLabel: {
        color: '#94a3b8',
        width: 80,
    },
    headerValue: {
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 15,
    },
    label: {
        width: 150,
    },
    labelTitle: {
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    labelSubtitle: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#64748b',
    },
    value: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 12,
    },
    terbilangRow: {
        flexDirection: 'row',
        marginBottom: 15,
        paddingBottom: 15,
    },
    terbilangLabel: {
        width: 150,
    },
    terbilangValue: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 11,
        color: '#f97316',
        fontStyle: 'italic',
    },
    amountBox: {
        backgroundColor: '#fef3c7',
        padding: 15,
        marginBottom: 20,
        borderRadius: 4,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#92400e',
        textAlign: 'center',
    },
    signatureArea: {
        marginTop: 40,
        alignItems: 'flex-end',
    },
    signatureBox: {
        width: 200,
        alignItems: 'center',
    },
    signatureLocation: {
        marginBottom: 10,
    },
    signatureLine: {
        width: 150,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 9,
        color: '#64748b',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1e293b',
        color: 'white',
        padding: 15,
    },
    footerText: {
        fontSize: 9,
    },
    footerSubtext: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#94a3b8',
        marginTop: 2,
    },
})

interface KuitansiPDFProps {
    kuitansi: KuitansiWithInvoice
}

export function KuitansiPDFDocument({ kuitansi }: KuitansiPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>KUITANSI</Text>
                    <View style={styles.headerInfo}>
                        <View>
                            <View style={styles.headerRow}>
                                <Text style={styles.headerLabel}>No. Kuitansi:</Text>
                                <Text style={styles.headerValue}>{kuitansi.no_kuitansi}</Text>
                            </View>
                            <View style={styles.headerRow}>
                                <Text style={styles.headerLabel}>Tanggal:</Text>
                                <Text style={styles.headerValue}>{formatDate(kuitansi.tanggal)}</Text>
                            </View>
                        </View>
                        <View>
                            <View style={styles.headerRow}>
                                <Text style={styles.headerLabel}>No. Invoice:</Text>
                                <Text style={styles.headerValue}>{kuitansi.invoice?.no_invoice}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Sudah diterima dari */}
                    <View style={styles.row}>
                        <View style={styles.label}>
                            <Text style={styles.labelTitle}>Sudah diterima dari</Text>
                            <Text style={styles.labelSubtitle}>Received from</Text>
                        </View>
                        <Text style={styles.value}>: {kuitansi.invoice?.customer?.name}</Text>
                    </View>

                    {/* Jumlah */}
                    <View style={styles.amountBox}>
                        <Text style={styles.amountValue}>Rp {formatCurrency(kuitansi.jumlah).replace('Rp', '').trim()}</Text>
                    </View>

                    {/* Terbilang */}
                    <View style={styles.terbilangRow}>
                        <View style={styles.terbilangLabel}>
                            <Text style={[styles.labelTitle, { color: '#f97316' }]}>Terbilang</Text>
                            <Text style={styles.labelSubtitle}>Amount in words</Text>
                        </View>
                        <Text style={styles.terbilangValue}>: {terbilang(kuitansi.jumlah)}</Text>
                    </View>

                    {/* Untuk Pembayaran */}
                    <View style={styles.row}>
                        <View style={styles.label}>
                            <Text style={[styles.labelTitle, { color: '#3b82f6' }]}>Untuk Pembayaran</Text>
                            <Text style={styles.labelSubtitle}>In Payment of</Text>
                        </View>
                        <Text style={[styles.value, { color: '#3b82f6' }]}>: {kuitansi.keterangan}</Text>
                    </View>

                    {/* Signature */}
                    <View style={styles.signatureArea}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLocation}>
                                {kuitansi.lokasi || 'Bandung'}, {formatDate(kuitansi.tanggal)}
                            </Text>
                            <View style={styles.signatureLine}></View>
                            <Text style={styles.signatureLabel}>(Penerima)</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Kuitansi ini berlaku sah, setelah uang diterima.</Text>
                    <Text style={styles.footerSubtext}>This payment will be legal, if the cheque has been accepted by the bank</Text>
                </View>
            </Page>
        </Document>
    )
}

export default KuitansiPDFDocument
