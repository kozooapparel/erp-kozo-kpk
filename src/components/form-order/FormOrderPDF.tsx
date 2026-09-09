'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Brand, ProductionSpecs, OrderWithCustomer } from '@/types/database'
import { getDeadlineProduksi, formatTanggal, PRODUKSI_DURATION_DAYS } from '@/lib/form-order'

interface FormOrderPDFProps {
    order: OrderWithCustomer
    brand?: Brand
}

const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: '2px solid #1d4ed8',
        paddingBottom: 8,
        marginBottom: 12,
    },
    logo: {
        width: 46,
        height: 46,
        objectFit: 'contain',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerSub: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 2,
    },
    // Body split
    body: {
        flexDirection: 'row',
        gap: 10,
    },
    colLeft: {
        width: '58%',
    },
    colRight: {
        width: '42%',
    },
    // Section
    section: {
        marginBottom: 10,
        border: '1px solid #e2e8f0',
        borderRadius: 3,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        backgroundColor: '#f1f5f9',
        padding: 5,
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
    },
    sectionBody: {
        padding: 5,
    },
    row: {
        flexDirection: 'row',
        borderBottom: '1px solid #f1f5f9',
        paddingVertical: 3,
    },
    label: {
        width: '45%',
        color: '#64748b',
        fontSize: 8,
    },
    value: {
        width: '55%',
        color: '#0f172a',
        fontSize: 8,
        fontWeight: 'bold',
    },
    // Images
    imageBox: {
        border: '1px solid #e2e8f0',
        borderRadius: 3,
        marginBottom: 8,
    },
    imageLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        backgroundColor: '#f1f5f9',
        padding: 4,
        color: '#1e293b',
    },
    // Kerah & Mockup dicetak pada skala 20% dari lebar halaman
    smallImage: {
        width: '20%',
        objectFit: 'contain',
        margin: 5,
    },
    listImage: {
        width: '100%',
        objectFit: 'contain',
        marginBottom: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 8,
    },
    bottomCol: {
        width: '50%',
    },
    footer: {
        position: 'absolute',
        bottom: 16,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTop: '1px solid #e2e8f0',
        paddingTop: 5,
        fontSize: 7,
        color: '#94a3b8',
    },
})

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value !== null && value !== undefined && value !== '' ? String(value) : '-'}</Text>
    </View>
)

export default function FormOrderPDF({ order, brand }: FormOrderPDFProps) {
    const specs = (order.production_specs as ProductionSpecs) || {}
    const listOrderImages = specs.list_order_image_urls || []

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header: logo brand + judul */}
                <View style={styles.header}>
                    {brand?.logo_url && <Image src={brand.logo_url} style={styles.logo} />}
                    <View>
                        <Text style={styles.headerTitle}>FORM ORDER PRODUKSI</Text>
                        <Text style={styles.headerSub}>
                            {[brand?.name, order.nama_po || order.spk_number].filter(Boolean).join(' · ')}
                        </Text>
                    </View>
                </View>

                <View style={styles.body}>
                    {/* Kolom kiri */}
                    <View style={styles.colLeft}>
                        {/* Data Customer (otomatis) */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Data Customer</Text>
                            <View style={styles.sectionBody}>
                                <Field label="Nama" value={order.customer?.name} />
                                <Field label="Tanggal Order" value={formatTanggal(order.created_at)} />
                                <Field
                                    label={`Deadline Produksi (${PRODUKSI_DURATION_DAYS} hari)`}
                                    value={formatTanggal(getDeadlineProduksi(order.created_at))}
                                />
                            </View>
                        </View>

                        {/* Detail Produk */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Detail Produk</Text>
                            <View style={styles.sectionBody}>
                                <Field label="Jenis Produk" value={specs.jenis_produk} />
                                <Field label="Jenis Bahan" value={specs.jenis_bahan} />
                                <Field label="Pola Baju / Desain" value={specs.pola_desain} />
                                <Field label="Model Kerah" value={specs.model_kerah} />
                                <Field label="Model Lengan" value={specs.model_lengan} />
                                <Field
                                    label="Jumlah Produksi"
                                    value={specs.jumlah_produksi ? `${specs.jumlah_produksi} pcs` : '-'}
                                />
                            </View>
                        </View>

                        {/* Kebutuhan Produksi */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Kebutuhan Produksi</Text>
                            <View style={styles.sectionBody}>
                                <Field
                                    label="Kebutuhan Bahan (meter)"
                                    value={specs.kebutuhan_bahan_meter ? `${specs.kebutuhan_bahan_meter} m` : '-'}
                                />
                                <Field
                                    label="Kebutuhan Bahan (kg)"
                                    value={specs.kebutuhan_bahan_kg ? `${specs.kebutuhan_bahan_kg} kg` : '-'}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Kolom kanan atas: List Order, memanjang ke bawah */}
                    <View style={styles.colRight}>
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>List Order</Text>
                            <View style={{ padding: 4 }}>
                                {listOrderImages.length > 0 ? (
                                    listOrderImages.map((url, idx) => (
                                        <Image key={`${url}-${idx}`} src={url} style={styles.listImage} />
                                    ))
                                ) : (
                                    <Text style={{ fontSize: 8, color: '#94a3b8', padding: 4 }}>
                                        Belum ada gambar list order
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bawah: Kerah (kiri) + Mockup (kanan), skala 20% */}
                <View style={styles.bottomRow}>
                    <View style={styles.bottomCol}>
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>Kerah</Text>
                            {specs.kerah_image_url ? (
                                <Image src={specs.kerah_image_url} style={styles.smallImage} />
                            ) : (
                                <Text style={{ fontSize: 8, color: '#94a3b8', padding: 5 }}>Belum ada gambar</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.bottomCol}>
                        <View style={styles.imageBox}>
                            <Text style={styles.imageLabel}>Mockup</Text>
                            {specs.mockup_image_url ? (
                                <Image src={specs.mockup_image_url} style={styles.smallImage} />
                            ) : (
                                <Text style={{ fontSize: 8, color: '#94a3b8', padding: 5 }}>Belum ada gambar</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text>{order.spk_number || 'DRAFT'}</Text>
                    <Text>{brand?.name || ''}</Text>
                </View>
            </Page>
        </Document>
    )
}
