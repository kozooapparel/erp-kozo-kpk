'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Order, Customer, SPKSection, ProductionSpecs, SizeRekapItem, PersonItem, Brand } from '@/types/database'

interface OrderWithCustomer extends Order {
    customer: Customer
}

interface SPKPDFProps {
    order: OrderWithCustomer
    brand?: Brand
    deadline?: string | null
}

// Register font (using built-in Helvetica)
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    // Header
    headerRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    headerLabel: {
        width: 100,
        backgroundColor: '#b3d4fc',
        padding: 4,
        fontWeight: 'bold',
        fontSize: 9,
    },
    headerValue: {
        flex: 1,
        backgroundColor: '#e8f4fc',
        padding: 4,
        fontSize: 9,
    },
    headerRight: {
        width: 150,
        backgroundColor: '#b3d4fc',
        padding: 4,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 9,
    },
    // Main content
    mainContainer: {
        flexDirection: 'row',
        flex: 1,
        marginTop: 5,
    },
    leftColumn: {
        width: '55%',
        paddingRight: 10,
        borderRight: '1px solid #e0e0e0',
    },
    rightColumn: {
        width: '45%',
        paddingLeft: 10,
    },
    // Mockup section
    mockupContainer: {
        marginBottom: 10,
    },
    mockupRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    mockupImage: {
        width: 80,
        height: 100,
        objectFit: 'contain',
        border: '1px solid #e0e0e0',
    },
    // Section title
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5',
        padding: 4,
        marginBottom: 5,
        marginTop: 10,
    },
    // Size table
    table: {
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#ffeb3b',
        borderBottom: '1px solid #000',
    },
    tableHeaderCell: {
        padding: 4,
        fontWeight: 'bold',
        fontSize: 7,
        textAlign: 'center',
        borderRight: '1px solid #e0e0e0',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #e0e0e0',
    },
    tableCell: {
        padding: 4,
        fontSize: 7,
        textAlign: 'center',
        borderRight: '1px solid #e0e0e0',
    },
    tableCellLeft: {
        padding: 4,
        fontSize: 7,
        textAlign: 'left',
        borderRight: '1px solid #e0e0e0',
    },
    // Simple list
    simpleList: {
        marginBottom: 10,
    },
    sizeGroup: {
        marginBottom: 5,
    },
    sizeLabel: {
        fontWeight: 'bold',
        fontSize: 9,
        marginBottom: 2,
    },
    nameList: {
        fontSize: 8,
        color: '#333',
        paddingLeft: 10,
    },
    // Personalization list
    personRow: {
        flexDirection: 'row',
        marginBottom: 2,
        paddingLeft: 5,
    },
    personCheck: {
        width: 12,
        fontSize: 8,
    },
    personName: {
        flex: 1,
        fontSize: 8,
    },
    personSize: {
        width: 30,
        fontSize: 8,
    },
    personSleeve: {
        width: 60,
        fontSize: 8,
    },
    // Production specs
    specsContainer: {
        marginTop: 10,
        borderTop: '1px solid #000',
        paddingTop: 10,
    },
    specsRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    specsLabel: {
        width: 100,
        fontWeight: 'bold',
        fontSize: 8,
    },
    specsValue: {
        flex: 1,
        fontSize: 8,
    },
    kerahContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    kerahImage: {
        width: 60,
        height: 60,
        objectFit: 'contain',
        border: '1px solid #e0e0e0',
        marginRight: 10,
    },
    kerahInfo: {
        flex: 1,
    },
    // Checklist
    checklistContainer: {
        marginTop: 10,
        padding: 8,
        backgroundColor: '#fff9c4',
        border: '1px solid #f9a825',
    },
    checklistTitle: {
        fontWeight: 'bold',
        fontSize: 9,
        marginBottom: 5,
    },
    checklistRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    checklistLabel: {
        width: 80,
        fontSize: 8,
    },
    checklistBox: {
        width: 40,
        height: 15,
        border: '1px solid #000',
        marginLeft: 10,
    },
    // Notes
    notesContainer: {
        marginTop: 10,
        padding: 8,
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800',
    },
    notesTitle: {
        fontWeight: 'bold',
        fontSize: 9,
        marginBottom: 3,
    },
    notesText: {
        fontSize: 8,
        lineHeight: 1.4,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
        fontSize: 7,
        color: '#9e9e9e',
        textAlign: 'center',
        borderTop: '1px solid #e0e0e0',
        paddingTop: 5,
    },
    // Lines (for empty list area)
    lineContainer: {
        marginTop: 5,
    },
    line: {
        height: 15,
        borderBottom: '1px solid #e0e0e0',
    },
})

export default function SPKPDF({ order, brand, deadline }: SPKPDFProps) {
    const formatDate = (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const namaPo = order.nama_po || order.customer?.name || '-'
    const sections = (order.spk_sections as SPKSection[] | null) || []
    const specs = (order.production_specs as ProductionSpecs | null) || null
    const oldSizeBreakdown = order.size_breakdown || {}

    // Render size breakdown table (Format A - Simple)
    const renderSimpleBreakdown = (breakdown: Record<string, number>) => {
        const sizes = Object.entries(breakdown).filter(([_, qty]) => qty > 0)
        if (sizes.length === 0) return null

        const total = sizes.reduce((sum, [_, qty]) => sum + qty, 0)

        return (
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: 60 }]}>REKAP UKURAN</Text>
                    <Text style={[styles.tableHeaderCell, { width: 50 }]}>JUMLAH</Text>
                </View>
                {sizes.map(([size, qty]) => (
                    <View key={size} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 60 }]}>{size}</Text>
                        <Text style={[styles.tableCell, { width: 50 }]}>{qty}</Text>
                    </View>
                ))}
                <View style={[styles.tableRow, { backgroundColor: '#e3f2fd' }]}>
                    <Text style={[styles.tableCell, { width: 60, fontWeight: 'bold' }]}>TOTAL</Text>
                    <Text style={[styles.tableCell, { width: 50, fontWeight: 'bold' }]}>{total}</Text>
                </View>
            </View>
        )
    }

    // Render size rekap table (Format C - With Keterangan)
    const renderSizeRekap = (rekap: SizeRekapItem[]) => {
        if (!rekap || rekap.length === 0) return null

        const total = rekap.reduce((sum, item) => sum + item.jumlah, 0)

        return (
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: 50 }]}>REKAP UKURAN</Text>
                    <Text style={[styles.tableHeaderCell, { width: 40 }]}>JUMLAH</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>KETERANGAN</Text>
                </View>
                {rekap.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 50 }]}>{item.size}</Text>
                        <Text style={[styles.tableCell, { width: 40 }]}>{item.jumlah}</Text>
                        <Text style={[styles.tableCellLeft, { flex: 1 }]}>{item.keterangan || ''}</Text>
                    </View>
                ))}
                <View style={[styles.tableRow, { backgroundColor: '#e3f2fd' }]}>
                    <Text style={[styles.tableCell, { width: 50, fontWeight: 'bold' }]}>TOTAL</Text>
                    <Text style={[styles.tableCell, { width: 40, fontWeight: 'bold' }]}>{total}</Text>
                    <Text style={[styles.tableCellLeft, { flex: 1 }]}></Text>
                </View>
            </View>
        )
    }

    // Render personalization list (Format B - Detail Names)
    const renderPersonalizationList = (persons: PersonItem[]) => {
        if (!persons || persons.length === 0) return null

        // Group by group if available
        const groups: Record<string, PersonItem[]> = {}
        persons.forEach(p => {
            const groupName = p.group || 'Default'
            if (!groups[groupName]) groups[groupName] = []
            groups[groupName].push(p)
        })

        const hasGroups = Object.keys(groups).length > 1 || !groups['Default']

        if (hasGroups) {
            return (
                <View>
                    {Object.entries(groups).map(([groupName, groupPersons]) => (
                        <View key={groupName} style={{ marginBottom: 8 }}>
                            <Text style={styles.sizeLabel}>{groupName}</Text>
                            {groupPersons.map((person, idx) => (
                                <View key={idx} style={styles.personRow}>
                                    <Text style={styles.personCheck}>{person.completed ? '✓' : '○'}</Text>
                                    <Text style={styles.personName}>{person.name}</Text>
                                    <Text style={styles.personSize}>/ {person.size}</Text>
                                    <Text style={styles.personSleeve}>/ {person.sleeve_type || 'Pendek'}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )
        }

        // No groups, render as table
        return (
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: 25 }]}>No</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Nama</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Nama Punggung</Text>
                    <Text style={[styles.tableHeaderCell, { width: 40 }]}>Ukuran</Text>
                    <Text style={[styles.tableHeaderCell, { width: 60 }]}>Lengan</Text>
                </View>
                {persons.map((person, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 25 }]}>{idx + 1}</Text>
                        <Text style={[styles.tableCellLeft, { flex: 1 }]}>{person.name}</Text>
                        <Text style={[styles.tableCellLeft, { flex: 1 }]}>{person.back_name || ''}</Text>
                        <Text style={[styles.tableCell, { width: 40 }]}>{person.size}</Text>
                        <Text style={[styles.tableCellLeft, { width: 60 }]}>{person.sleeve_type || 'Pendek'}</Text>
                    </View>
                ))}
            </View>
        )
    }

    // Render section content
    const renderSectionContent = (section: SPKSection) => {
        // Check which format to render
        if (section.personalization_list && section.personalization_list.length > 0) {
            return renderPersonalizationList(section.personalization_list)
        }
        if (section.size_rekap && section.size_rekap.length > 0) {
            return renderSizeRekap(section.size_rekap)
        }
        if (section.size_breakdown && Object.keys(section.size_breakdown).length > 0) {
            return renderSimpleBreakdown(section.size_breakdown)
        }
        return null
    }

    // Empty lines for manual writing
    const renderEmptyLines = (count: number) => (
        <View style={styles.lineContainer}>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={styles.line} />
            ))}
        </View>
    )

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.headerLabel}>NAMA PO</Text>
                    <Text style={styles.headerValue}>{namaPo}</Text>
                    <Text style={styles.headerRight}>LIST UKURAN</Text>
                </View>
                <View style={styles.headerRow}>
                    <Text style={styles.headerLabel}>TANGGAL DATE LINE</Text>
                    <Text style={styles.headerValue}>{formatDate(deadline || order.deadline)}</Text>
                </View>

                {/* Main Content - 2 Column Layout */}
                <View style={styles.mainContainer}>
                    {/* Left Column - Mockups */}
                    <View style={styles.leftColumn}>
                        {sections.length > 0 ? (
                            sections.map((section, idx) => (
                                <View key={section.id || idx} style={styles.mockupContainer}>
                                    {section.mockup_urls && section.mockup_urls.length > 0 && (
                                        <View style={styles.mockupRow}>
                                            {section.mockup_urls.slice(0, 4).map((url, imgIdx) => (
                                                <Image key={imgIdx} src={url} style={styles.mockupImage} />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            // Fallback to old mockup/layout URLs
                            <View style={styles.mockupContainer}>
                                {order.mockup_url && (
                                    <Image src={order.mockup_url} style={[styles.mockupImage, { width: 150, height: 180 }]} />
                                )}
                                {order.layout_url && (
                                    <Image src={order.layout_url} style={[styles.mockupImage, { width: 150, height: 180, marginTop: 10 }]} />
                                )}
                            </View>
                        )}

                        {/* Collar and Production Specs at bottom left */}
                        <View style={styles.kerahContainer}>
                            {specs?.kerah_image_url && (
                                <Image src={specs.kerah_image_url} style={styles.kerahImage} />
                            )}
                            <View style={styles.kerahInfo}>
                                <Text style={styles.sizeLabel}>KERAH</Text>
                                <Text style={{ fontSize: 8, marginTop: 2 }}>{specs?.kerah || '-'}</Text>
                            </View>
                        </View>

                        {/* Production Specs Table */}
                        <View style={{ marginTop: 10 }}>
                            <View style={styles.specsRow}>
                                <Text style={styles.specsLabel}>BAHAN:</Text>
                                <Text style={styles.specsValue}>{specs?.bahan || ''}</Text>
                            </View>
                            <View style={styles.specsRow}>
                                <Text style={styles.specsLabel}>BAHAN CELANA:</Text>
                                <Text style={styles.specsValue}>{specs?.bahan_celana || ''}</Text>
                            </View>
                            <View style={styles.specsRow}>
                                <Text style={styles.specsLabel}>KATEGORI:</Text>
                                <Text style={styles.specsValue}>{specs?.kategori || ''}</Text>
                            </View>
                            <View style={styles.specsRow}>
                                <Text style={styles.specsLabel}>BIS:</Text>
                                <Text style={styles.specsValue}>{specs?.bis || ''}</Text>
                            </View>
                            <View style={styles.specsRow}>
                                <Text style={styles.specsLabel}>AUTENTIC:</Text>
                                <Text style={styles.specsValue}>{specs?.autentic || ''}</Text>
                            </View>
                            <View style={styles.specsRow}>
                                <Text style={styles.specsLabel}>PENJAHIT:</Text>
                                <Text style={styles.specsValue}>{specs?.penjahit || ''}</Text>
                            </View>
                        </View>

                        {/* Checklist */}
                        <View style={styles.checklistContainer}>
                            <Text style={styles.checklistTitle}>WAJIB DIISI!</Text>
                            <View style={styles.checklistRow}>
                                <Text style={styles.checklistLabel}>ATASAN</Text>
                                <View style={styles.checklistBox}>
                                    {specs?.need_atasan && <Text style={{ textAlign: 'center', fontSize: 10 }}>✓</Text>}
                                </View>
                            </View>
                            <View style={styles.checklistRow}>
                                <Text style={styles.checklistLabel}>CELANA</Text>
                                <View style={styles.checklistBox}>
                                    {specs?.need_celana && <Text style={{ textAlign: 'center', fontSize: 10 }}>✓</Text>}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Size List */}
                    <View style={styles.rightColumn}>
                        {sections.length > 0 ? (
                            sections.map((section, idx) => (
                                <View key={section.id || idx}>
                                    {sections.length > 1 && (
                                        <Text style={styles.sectionTitle}>{section.title}</Text>
                                    )}
                                    {renderSectionContent(section)}

                                    {/* Section mockup (small) for multi-product */}
                                    {sections.length > 1 && section.mockup_urls && section.mockup_urls.length > 0 && (
                                        <View style={{ flexDirection: 'row', marginTop: 5, marginBottom: 10 }}>
                                            <Text style={{ fontSize: 7, fontWeight: 'bold', marginRight: 5 }}>JENIS KERAH</Text>
                                            {section.mockup_urls.slice(0, 2).map((url, imgIdx) => (
                                                <Image key={imgIdx} src={url} style={{ width: 40, height: 50, marginRight: 5 }} />
                                            ))}
                                        </View>
                                    )}

                                    {section.notes && (
                                        <Text style={{ fontSize: 7, fontStyle: 'italic', marginTop: 5, color: '#666' }}>
                                            {section.notes}
                                        </Text>
                                    )}
                                </View>
                            ))
                        ) : (
                            // Fallback to old size_breakdown
                            <>
                                {Object.keys(oldSizeBreakdown).length > 0 ? (
                                    renderSimpleBreakdown(oldSizeBreakdown)
                                ) : (
                                    renderEmptyLines(20)
                                )}
                            </>
                        )}

                        {/* Catatan Section on right */}
                        {order.production_notes && (
                            <View style={[styles.notesContainer, { marginTop: 'auto' }]}>
                                <Text style={styles.notesTitle}>Catatan</Text>
                                <Text style={styles.notesText}>{order.production_notes}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer with Brand */}
                <View style={[styles.footer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <Text>{order.spk_number || 'SPK'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {brand?.logo_url && (
                            <Image src={brand.logo_url} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        )}
                        <Text>{brand?.company_name || 'Kozo KPK'}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
