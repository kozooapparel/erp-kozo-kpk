'use client'

import { useEffect, useId, useMemo, useRef, useState, type SVGProps } from 'react'
import type { Barang } from '@/types/database'
import { formatCurrency } from '@/lib/utils/format'

interface ItemPickerProps {
    /** Deskripsi terpilih / teks manual pada baris invoice */
    value: string
    /** ID barang yang tertaut (null jika item manual) */
    barangId: string | null
    /** Daftar barang yang bisa dipilih (sudah difilter per brand) */
    items: Barang[]
    /** Picker butuh brand untuk memuat daftar barang */
    hasBrand: boolean
    disabled?: boolean
    /** User memilih barang dari daftar */
    onSelectItem: (barang: Barang) => void
    /** User mengetik deskripsi manual */
    onChangeText: (text: string) => void
    /** User ingin menyimpan barang baru (dibawa nama yang sudah diketik) */
    onCreateNew: (typedName: string) => void
}

const IconSearch = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
    </svg>
)

const IconCheck = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m5 13 4 4L19 7" />
    </svg>
)

const IconClose = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M6 18 18 6M6 6l12 12" />
    </svg>
)

const IconPlus = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 5v14M5 12h14" />
    </svg>
)

/**
 * Smart item picker untuk baris invoice.
 * - Klik/fokus langsung membuka daftar barang (langsung bisa cari dengan mengetik)
 * - Bisa pilih barang (harga & satuan otomatis) atau ketik manual
 * - Navigasi keyboard: Arrow Up/Down, Enter, Escape, Tab
 */
export default function ItemPicker({
    value,
    barangId,
    items,
    hasBrand,
    disabled = false,
    onSelectItem,
    onChangeText,
    onCreateNew,
}: ItemPickerProps) {
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const listboxId = useId()

    const isDisabled = disabled || !hasBrand

    // Filter instan di sisi klien supaya terasa cepat
    const filtered = useMemo(() => {
        const q = value.trim().toLowerCase()
        if (!q) return items
        return items.filter(b =>
            b.nama_barang.toLowerCase().includes(q) ||
            (b.kategori ?? '').toLowerCase().includes(q)
        )
    }, [items, value])

    // Sorotan diklem saat render supaya tidak perlu setState di dalam effect
    const safeIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0))

    // Tutup saat klik di luar
    useEffect(() => {
        if (!open) return
        const handlePointerDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handlePointerDown)
        return () => document.removeEventListener('mousedown', handlePointerDown)
    }, [open])

    // Jaga opsi yang tersorot tetap terlihat
    useEffect(() => {
        if (!open || !listRef.current) return
        const el = listRef.current.children[safeIndex] as HTMLElement | undefined
        el?.scrollIntoView({ block: 'nearest' })
    }, [safeIndex, open])

    const select = (barang: Barang) => {
        setOpen(false)
        onSelectItem(barang)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!open) {
                setOpen(true)
                return
            }
            setActiveIndex(Math.min(safeIndex + 1, Math.max(filtered.length - 1, 0)))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(Math.max(safeIndex - 1, 0))
        } else if (e.key === 'Enter') {
            if (open && filtered[safeIndex]) {
                e.preventDefault()
                select(filtered[safeIndex])
            }
        } else if (e.key === 'Escape') {
            if (open) {
                e.preventDefault()
                setOpen(false)
            }
        } else if (e.key === 'Tab') {
            setOpen(false)
        }
    }

    const showList = open && !isDisabled
    const emptyList = items.length === 0
    const noResult = !emptyList && filtered.length === 0

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <IconSearch className="h-4 w-4" />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        showList && filtered[safeIndex] ? `${listboxId}-${filtered[safeIndex].id}` : undefined
                    }
                    value={value}
                    disabled={isDisabled}
                    placeholder={hasBrand ? 'Cari atau ketik nama barang...' : 'Pilih brand dulu'}
                    onChange={(e) => {
                        onChangeText(e.target.value)
                        setActiveIndex(0)
                        setOpen(true)
                    }}
                    onFocus={(e) => {
                        setActiveIndex(0)
                        setOpen(true)
                        e.target.select()
                    }}
                    onBlur={() => setOpen(false)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-14 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                />
                {barangId && !isDisabled && (
                    <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                        <span className="text-emerald-500" title="Terhubung ke data barang">
                            <IconCheck className="h-3.5 w-3.5" />
                        </span>
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Hapus pilihan barang"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChangeText('')
                                inputRef.current?.focus()
                            }}
                            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                            <IconClose className="h-3.5 w-3.5" />
                        </button>
                    </span>
                )}
            </div>

            {showList && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-fadeIn">
                    {emptyList || noResult ? (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-slate-500">
                                {emptyList ? 'Belum ada barang untuk brand ini' : 'Barang tidak ditemukan'}
                            </p>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setOpen(false)
                                    onCreateNew(value.trim())
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                            >
                                <IconPlus className="h-3.5 w-3.5" />
                                Tambah &ldquo;{value.trim() || 'barang baru'}&rdquo; sebagai barang baru
                            </button>
                        </div>
                    ) : (
                        <ul
                            ref={listRef}
                            id={listboxId}
                            role="listbox"
                            className="max-h-64 overflow-y-auto py-1 scrollbar-thin"
                        >
                            {filtered.map((barang, index) => {
                                const isActive = index === safeIndex
                                const isSelected = barang.id === barangId
                                return (
                                    <li
                                        key={barang.id}
                                        id={`${listboxId}-${barang.id}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => select(barang)}
                                        className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 transition-colors ${
                                            isActive ? 'bg-brand-50' : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                                                {isSelected && <IconCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                                                {barang.nama_barang}
                                            </p>
                                            {barang.kategori && (
                                                <p className="truncate text-xs text-slate-400">{barang.kategori}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-semibold tabular-nums text-slate-700">
                                                {formatCurrency(barang.harga_satuan)}
                                            </p>
                                            <p className="text-xs text-slate-400">/{barang.satuan}</p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
