'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useApplicationIdentity } from '@/components/layout/AppIdentityProvider'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()
    const identity = useApplicationIdentity()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950">
            {/* === RED BRAND MESH GRADIENT ORBS === */}
            <div
                className="absolute w-[700px] h-[700px] rounded-full blur-[120px] opacity-50"
                style={{
                    background: 'radial-gradient(circle, rgba(220,38,38,0.4) 0%, transparent 70%)',
                    top: '-20%',
                    left: '-15%',
                    animation: 'float1 22s ease-in-out infinite',
                }}
            />
            <div
                className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-40"
                style={{
                    background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                    bottom: '-20%',
                    right: '-10%',
                    animation: 'float2 28s ease-in-out infinite',
                }}
            />
            <div
                className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(185,28,28,0.3) 0%, transparent 70%)',
                    top: '30%',
                    right: '10%',
                    animation: 'float3 20s ease-in-out infinite',
                }}
            />
            <div
                className="absolute w-[450px] h-[450px] rounded-full blur-[100px] opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)',
                    bottom: '10%',
                    left: '20%',
                    animation: 'float4 24s ease-in-out infinite',
                }}
            />

            {/* === GRID PATTERN === */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                }}
            />

            <style jsx global>{`
                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(40px, -60px) scale(1.1); }
                    50% { transform: translate(-30px, 30px) scale(0.95); }
                    75% { transform: translate(20px, 50px) scale(1.05); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(-50px, 40px) scale(1.15); }
                    50% { transform: translate(35px, -35px) scale(0.9); }
                    75% { transform: translate(-25px, -50px) scale(1.1); }
                }
                @keyframes float3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(25px, 45px) scale(1.08); }
                    50% { transform: translate(-40px, -30px) scale(0.92); }
                    75% { transform: translate(35px, -20px) scale(1.12); }
                }
                @keyframes float4 {
                    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    33% { transform: translate(-30px, 50px) scale(1.1) rotate(5deg); }
                    66% { transform: translate(40px, -30px) scale(0.9) rotate(-5deg); }
                }
            `}</style>

            {/* ================================ */}
            {/* ========== CONTENT ============= */}
            {/* ================================ */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo & Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-gradient mb-5 shadow-lg shadow-red-900/40 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                        {identity.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={identity.logoUrl} alt={`${identity.name} logo`} className="w-full h-full object-contain bg-white p-2" />
                        ) : (
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        {identity.name}
                    </h1>
                    <p className="text-red-300/80 text-sm tracking-widest uppercase font-medium">
                        Jersey Convection Management
                    </p>
                </div>

                {/* Login Card */}
                <form onSubmit={handleLogin}>
                    <div
                        className="rounded-3xl p-8 border border-white/10 shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                        }}
                    >
                        {error && (
                            <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all duration-300 hover:bg-white/[0.08]"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all duration-300 hover:bg-white/[0.08]"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-7 w-full py-3.5 px-4 rounded-xl bg-brand-gradient text-white font-semibold shadow-lg shadow-red-900/30 hover:shadow-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? (
                                <span className="inline-flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500/70">
                    Owner & Admin access only
                </p>
            </div>
        </div>
    )
}
