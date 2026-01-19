'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types/database'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DashboardLayoutProps {
    user: Profile | null
    children: React.ReactNode
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false)
            }
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const mainMenuItems = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            href: '/customers',
            label: 'Customers',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            href: '/barang',
            label: 'Barang',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
    ]



    const invoiceItems = [
        {
            href: '/invoices',
            label: 'Invoice',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            href: '/invoices/rekap',
            label: 'Rekap Invoice',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
    ]

    const keuanganItems = [
        {
            href: '/kuitansi',
            label: 'Kuitansi',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            href: '/kuitansi/rekap',
            label: 'Rekap Kuitansi',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
    ]

    const renderNavItem = (item: typeof mainMenuItems[0]) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
            <a
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${sidebarOpen ? '' : 'justify-center'}`}
            >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
            </a>
        )
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Mobile Overlay Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${sidebarOpen ? 'w-64' : 'w-20'} 
                flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300
                ${isMobile ? 'fixed top-0 h-screen z-50' : 'sticky top-0 h-screen'}
                ${isMobile ? (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        {sidebarOpen && (
                            <div className="overflow-hidden">
                                <h1 className="text-base font-semibold text-slate-900 whitespace-nowrap">
                                    Kozo <span className="text-brand">KPK</span>
                                </h1>
                                <p className="text-xs text-slate-500 whitespace-nowrap">Jersey Convection</p>
                            </div>
                        )}
                        {/* Mobile Close Button */}
                        {isMobile && (
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="ml-auto p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center"
                    title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                    {/* Main Menu Section */}
                    <div>
                        {sidebarOpen && (
                            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Main Menu
                            </p>
                        )}
                        <div className="space-y-1">
                            {mainMenuItems.map(renderNavItem)}
                        </div>
                    </div>



                    {/* Invoice Section */}
                    <div>
                        {sidebarOpen && (
                            <p className="px-3 mb-2 text-[11px] font-semibold text-orange-500 uppercase tracking-wider">
                                Invoice
                            </p>
                        )}
                        <div className="space-y-1">
                            {invoiceItems.map(renderNavItem)}
                        </div>
                    </div>

                    {/* Keuangan Section */}
                    <div>
                        {sidebarOpen && (
                            <p className="px-3 mb-2 text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                                Keuangan
                            </p>
                        )}
                        <div className="space-y-1">
                            {keuanganItems.map(renderNavItem)}
                        </div>
                    </div>

                    {/* Settings Section - Owner Only */}
                    {user?.role === 'owner' && (
                        <div>
                            {sidebarOpen && (
                                <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Settings
                                </p>
                            )}
                            <div className="space-y-1">
                                {renderNavItem({
                                    href: '/users',
                                    label: 'Kelola User',
                                    icon: (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-slate-200">
                    {sidebarOpen ? (
                        <>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100">
                                <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name || 'User'}</p>
                                    <p className="text-xs text-slate-500 truncate capitalize">{user?.role || 'admin'}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white font-medium text-sm">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50 md:ml-0">
                {/* Mobile Header with Hamburger */}
                {isMobile && (
                    <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="font-semibold text-slate-900">Kozo <span className="text-brand">KPK</span></span>
                        </div>
                    </div>
                )}
                <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    {children}
                </div>
            </main>
        </div>
    )
}
