'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AddCustomerModal from './AddCustomerModal'
import CustomerDetailModal from './CustomerDetailModal'

interface CustomerWithStats {
    id: string
    name: string
    phone: string
    created_at: string
    order_count: number
    total_quantity: number
    total_revenue: number
}

interface CustomerListProps {
    customers: CustomerWithStats[]
}

export default function CustomerList({ customers }: CustomerListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const getCustomerTier = (orderCount: number) => {
        if (orderCount >= 10) return { label: 'VIP', color: 'bg-amber-500', icon: '👑' }
        if (orderCount >= 5) return { label: 'Loyal', color: 'bg-purple-500', icon: '💎' }
        if (orderCount >= 2) return { label: 'Repeat', color: 'bg-blue-500', icon: '🔄' }
        return { label: 'New', color: 'bg-emerald-500', icon: '✨' }
    }

    const totalCustomers = customers.length
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_revenue, 0)
    const vipCount = customers.filter(c => c.order_count >= 10).length
    const repeatCount = customers.filter(c => c.order_count >= 2).length

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Dashboard
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Daftar Customer</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg shadow-red-500/25"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Tambah Customer
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Total Customer</p>
                    <p className="text-2xl font-bold text-slate-900">{totalCustomers}</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">VIP Customers</p>
                    <p className="text-2xl font-bold text-amber-600">{vipCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Repeat Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{repeatCount}</p>
                </div>
            </div>

            {/* Customer List - Responsive */}
            {isMobile ? (
                // Mobile: Card Layout
                <div className="space-y-3">
                    {customers.map((customer, index) => {
                        const tier = getCustomerTier(customer.order_count)
                        return (
                            <div
                                key={customer.id}
                                className={`p-4 rounded-2xl bg-white border shadow-sm transition-all hover:shadow-md ${index === 0 ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'
                                    }`}
                            >
                                {/* Header: Avatar, Name, Tier Badge */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <button
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="font-semibold text-slate-900 hover:text-red-600 transition-colors block truncate text-left"
                                        >
                                            {customer.name}
                                        </button>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white ${tier.color} mt-1`}>
                                            {tier.icon} {tier.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {customer.phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        {customer.order_count} orders
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        {customer.total_quantity} pcs
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatCurrency(customer.total_revenue)}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => setSelectedCustomer(customer)}
                                        className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium text-center transition-colors"
                                    >
                                        Lihat Detail
                                    </button>
                                    <a
                                        href={`https://wa.me/${customer.phone.replace(/^0/, '62')}`}
                                        target="_blank"
                                        className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        )
                    })}

                    {customers.length === 0 && (
                        <p className="text-center text-slate-400 py-8">Belum ada customer</p>
                    )}
                </div>
            ) : (
                // Desktop: Table Layout
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Customer</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">No. HP</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Orders</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Qty</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Revenue</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer, index) => {
                                    const tier = getCustomerTier(customer.order_count)
                                    return (
                                        <tr
                                            key={customer.id}
                                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === 0 ? 'bg-amber-50' : ''
                                                }`}
                                        >
                                            <td className="py-3 px-4">
                                                <button onClick={() => setSelectedCustomer(customer)} className="flex items-center gap-3 group text-left">
                                                    <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-900 group-hover:text-red-600 transition-colors">
                                                        {customer.name}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">{customer.phone}</td>
                                            <td className="py-3 px-4 text-center font-medium text-slate-900">{customer.order_count}</td>
                                            <td className="py-3 px-4 text-center text-slate-500">{customer.total_quantity} pcs</td>
                                            <td className="py-3 px-4 text-right font-medium text-emerald-600">
                                                {formatCurrency(customer.total_revenue)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${tier.color}`}>
                                                    {tier.icon} {tier.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <a
                                                        href={`https://wa.me/${customer.phone.replace(/^0/, '62')}`}
                                                        target="_blank"
                                                        className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                                        title="Chat WhatsApp"
                                                    >
                                                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {customers.length === 0 && (
                        <p className="text-center text-slate-400 py-8">Belum ada customer</p>
                    )}
                </div>
            )}

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Customer Detail Modal */}
            <CustomerDetailModal
                customer={selectedCustomer}
                isOpen={selectedCustomer !== null}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    )
}

